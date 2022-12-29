package api

import (
	"context"
	"fmt"
	"strings"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	gogpt "github.com/sashabaranov/go-gpt3"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

/******
*
* WARNING, EXPERIMENTAL
*
*******/
func (api *API) OverviewViewsSuggestion(c *gin.Context) {
	userID := getUserIDFromContext(c)
	user, err := database.GetUser(api.DB, userID)

	if !strings.HasSuffix(strings.ToLower(user.Email), "@generaltask.com") {
		api.Logger.Error().Err(err).Msg("outside user access to suggestions attempted")
		c.JSON(400, gin.H{"detail": "inaccessible"})
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

	if len(views) == 0 {
		c.JSON(200, gin.H{})
		return
	}

	sectionNames := ""
	for _, view := range views {
		name := ""
		switch view.Type {
		case string(constants.ViewTaskSection):
			name = api.getTaskSectionName(userID, view)
		case string(constants.ViewLinear):
			name = constants.ViewLinearName
		case string(constants.ViewSlack):
			name = constants.ViewSlackName
		case string(constants.ViewGithub):
			name = api.getGithubViewName(userID, view)
		case string(constants.ViewMeetingPreparation):
			name = constants.ViewMeetingPreparationName
		case string(constants.ViewDueToday):
			name = constants.ViewDueTodayName
		default:
			continue
		}

		if name != "" {
			sectionNames = sectionNames + `"` + name + `", `
		}
	}

	token := config.GetConfigValue("OPEN_AI_CLIENT_SECRET")
	client := gogpt.NewClient(token)
	ctx := context.Background()
	req := gogpt.CompletionRequest{
		Model:            gogpt.GPT3TextDavinci003,
		MaxTokens:        500,
		Temperature:      0.2,
		TopP:             1.0,
		FrequencyPenalty: 0.0,
		PresencePenalty:  0.0,
		BestOf:           1,
		Prompt:           getPrompt(sectionNames),
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
		response[fmt.Sprint(idx)] = suggestion
		idx++
	}

	c.JSON(200, response)
}

func getPrompt(sectionNames string) string {
	return "I have folders in which I keep tasks. The tasks are related to the folder in question. The folders are as follows: " + sectionNames + ". If I want to prioritize to be most effective at my job, a startup software engineer, in which order should I complete the tasks in these folders? Please provide only a numbered ordering, I do not need reasoning."
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
