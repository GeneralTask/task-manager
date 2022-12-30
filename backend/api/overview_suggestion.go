package api

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	gogpt "github.com/sashabaranov/go-gpt3"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type GPTView struct {
	Name      string    `json:"name"`
	ViewItems []GPTTask `json:"view_items"`
}

type GPTTask struct {
	Title string `json:"title"`
}

/******
*
* WARNING, EXPERIMENTAL
*
*******/
func (api *API) OverviewViewsSuggestion(c *gin.Context) {
	userID := getUserIDFromContext(c)
	user, err := database.GetUser(api.DB, userID)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to find user")
		Handle500(c)
		return
	}

	if !strings.HasSuffix(strings.ToLower(user.Email), "@generaltask.com") {
		api.Logger.Error().Err(err).Msg("outside user access to suggestions attempted")
		c.JSON(400, gin.H{"detail": "inaccessible"})
		return
	}

	timezoneOffset, err := GetTimezoneOffsetFromHeader(c)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	cursor, err := database.GetViewCollection(api.DB).Find(
		context.Background(),
		bson.M{"user_id": userID},
	)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to find views")
		Handle500(c)
		return
	}

	var views []database.View
	err = cursor.All(context.Background(), &views)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to find views")
		Handle500(c)
		return
	}

	overviewResponse, err := api.GetOverviewResults(views, userID, timezoneOffset)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to load views")
		Handle500(c)
		return
	}

	var gptViews []GPTView
	jsonBytes, err := json.Marshal(overviewResponse)
	if err != nil {
		api.Logger.Error().Err(err).Msg("unable to marshal overview response")
		Handle500(c)
		return
	}
	err = json.Unmarshal(jsonBytes, &gptViews)
	if err != nil {
		api.Logger.Error().Err(err).Msg("error unmarshaling overview response")
		Handle500(c)
		return
	}

	promptConstruction := ""
	for _, gptView := range gptViews {
		promptConstruction = promptConstruction + `"` + gptView.Name + `" with tasks (`
		for _, gptTask := range gptView.ViewItems {
			promptConstruction = promptConstruction + `"` + gptTask.Title + `", `
		}
		promptConstruction = promptConstruction + `), `
	}

	token := config.GetConfigValue("OPEN_AI_CLIENT_SECRET")
	client := gogpt.NewClient(token)
	ctx := context.Background()
	req := gogpt.CompletionRequest{
		Model:            gogpt.GPT3TextDavinci003,
		MaxTokens:        1000,
		Temperature:      0.2,
		TopP:             1.0,
		FrequencyPenalty: 0.0,
		PresencePenalty:  0.0,
		BestOf:           1,
		Prompt:           getPrompt(promptConstruction),
	}
	resp, err := client.CreateCompletion(ctx, req)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to fetch suggestion")
		Handle500(c)
		return
	}

	response := bson.M{}
	idx := 0
	for _, suggestion := range strings.Split(resp.Choices[0].Text, "\n") {
		if suggestion == "" {
			continue
		} else if strings.Index(suggestion, ". ") != 0 {
			// strip number from start
			suggestion = suggestion[strings.Index(suggestion, ". ")+2:]
		}
		if strings.Index(suggestion, ": ") != 0 {
			// strip reasoning
			reasoning := suggestion[strings.Index(suggestion, ": ")+2:]
			suggestion = suggestion[:strings.Index(suggestion, ": ")]
			response[fmt.Sprint(idx)+" reasoning"] = reasoning
		}
		response[fmt.Sprint(idx)] = suggestion
		idx++
	}

	if len(response) != (len(views) * 2) {
		api.Logger.Error().Err(err).Msg("failed to fetch suggestions for all sections")
		Handle500(c)
		return
	}

	c.JSON(200, response)
}

func getPrompt(sectionString string) string {
	return "I have folders in which I keep tasks. The tasks are related to the folder in question. The folders are as follows: " + sectionString + ". If I value helping the team, fixing bugs, good engineering and being dependable, in which order should I complete these folders? Please provide the order, and then short reasoning as to why it is prioritized after the ordering."
}

func (api *API) getTaskSectionName(userID primitive.ObjectID, view database.View) string {
	name, err := database.GetTaskSectionName(api.DB, view.TaskSectionID, userID)
	if err != nil {
		return ""
	}
	return name
}

func (api *API) getGithubViewName(userID primitive.ObjectID, view database.View) string {
	var repository database.Repository
	repositoryCollection := database.GetRepositoryCollection(api.DB)
	err := repositoryCollection.FindOne(context.Background(), bson.M{"$and": []bson.M{{"repository_id": view.GithubID, "user_id": userID}}}).Decode(&repository)
	if err != nil {
		return ""
	}

	return fmt.Sprintf("GitHub PRs from %s", repository.FullName)
}
