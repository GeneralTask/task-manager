package api

import (
	"context"
	"encoding/json"
	"math/rand"
	"regexp"
	"strings"
	"time"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	gogpt "github.com/sashabaranov/go-gpt3"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type GPTView struct {
	ID        primitive.ObjectID `json:"id"`
	Name      string             `json:"name"`
	ViewItems []GPTTask          `json:"view_items"`
}

type GPTTask struct {
	Title string `json:"title"`
}

type Suggestion struct {
	ID        primitive.ObjectID `json:"id"`
	Reasoning string             `json:"reasoning"`
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

	timezoneOffset, err := GetTimezoneOffsetFromHeader(c)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	suggestionsLeft, err := api.getRemainingSuggestionsForUser(user, timezoneOffset)
	if err != nil {
		c.JSON(400, gin.H{"error": "error fetching suggestions"})
		return
	}
	if suggestionsLeft < 1 && !strings.HasSuffix(strings.ToLower(user.Email), "@generaltask.com") {
		c.JSON(400, gin.H{"error": "no remaining suggestions for user"})
		return
	}

	err = api.decrementGPTRemainingByOne(user, timezoneOffset)
	if err != nil {
		api.Logger.Error().Err(err).Msg("unable to decrement suggestions remaining")
		Handle500(c)
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
		nameSanitized := sanitizeGPTString(gptView.Name)
		promptConstruction = promptConstruction + `"` + nameSanitized + `" with tasks (`
		for _, gptTask := range gptView.ViewItems {
			promptConstruction = promptConstruction + `"` + gptTask.Title + `", `
		}
		promptConstruction = promptConstruction + `), `
	}

	token := config.GetConfigValue("OPEN_AI_CLIENT_SECRET")
	client := gogpt.NewClient(token)
	if api.ExternalConfig.OpenAIOverrideURL != "" {
		client.BaseURL = api.ExternalConfig.OpenAIOverrideURL
	}
	ctx := context.Background()
	req := gogpt.CompletionRequest{
		Model:            gogpt.GPT3TextDavinci003,
		MaxTokens:        1500,
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

	response := []Suggestion{}
	idx := 0
	for _, suggestion := range strings.Split(resp.Choices[0].Text, "\n") {
		suggestionResponse := Suggestion{}
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
			suggestionResponse.Reasoning = reasoning
		}

		var suggestionID primitive.ObjectID
		for _, gptView := range gptViews {
			sanitizedView := sanitizeGPTString(gptView.Name)
			if sanitizedView == suggestion {
				suggestionID = gptView.ID
				suggestionResponse.ID = suggestionID
			}
		}
		response = append(response, suggestionResponse)
		idx++
	}

	if len(response) != len(views) {
		api.Logger.Error().Err(err).Msg("failed to fetch suggestions")
		Handle500(c)
		return
	}

	// not most efficient, but easy to understand
	missingList := []GPTView{}
	for _, gptView := range gptViews {
		missingList = append(missingList, gptView)
	}
	for _, suggestion := range response {
		missingList = removeFromList(missingList, suggestion.ID)
	}

	for _, suggestion := range response {
		if suggestion.ID == primitive.NilObjectID && suggestion.Reasoning != "" {
			for _, view := range missingList {
				for _, task := range view.ViewItems {
					if strings.Contains(suggestion.Reasoning, task.Title) {
						suggestion.ID = view.ID
						missingList = removeFromList(missingList, view.ID)
						continue
					}
				}
			}
		} else if suggestion.ID == primitive.NilObjectID {
			randomIndex := rand.Intn(len(missingList))
			suggestion.ID = missingList[randomIndex].ID
			missingList = removeFromList(missingList, missingList[randomIndex].ID)
		}
	}

	c.JSON(200, response)
}

func removeFromList(idList []GPTView, idToRemove primitive.ObjectID) []GPTView {
	for idx, list := range idList {
		if list.ID == idToRemove {
			return append(idList[:idx], idList[idx:]...)
		}
	}
	return idList
}

func getPrompt(sectionString string) string {
	return `I have folders in which I keep tasks. The tasks in general are related to the folder. The folders are as follows: ` + sectionString + `
	I am an employee at a startup, and I value efficient engineering, unblocking my coworkers before starting my own work, being prepared for meetings, and helping the company towards its goals. I would like to feel as productive as possible.
	Provide an ordering in which I should complete these folders, in accordance with my values. In this ordering, use the name of the folder verbatim. For each folder, provide a short reason as to why the folder was prioritized as it was. Refer to one of the tasks in part of the reasoning. Do not mention tasks if there are none in the folder. Do not use the first person in the reasoning. Do not use any profanity or offensive language.
	`
}

func (api *API) OverviewViewsSuggestionsRemaining(c *gin.Context) {
	userID := getUserIDFromContext(c)
	user, err := database.GetUser(api.DB, userID)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to find user")
		Handle500(c)
		return
	}

	timezoneOffset, err := GetTimezoneOffsetFromHeader(c)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	suggestionsLeft, err := api.getRemainingSuggestionsForUser(user, timezoneOffset)
	if err != nil {
		api.Logger.Error().Err(err).Msg("error fetching suggestions remaining")
		Handle500(c)
		return
	}

	c.JSON(200, suggestionsLeft)
}

func (api *API) getRemainingSuggestionsForUser(user *database.User, timezoneOffset time.Duration) (int, error) {
	lastSuggestionPrim := user.GPTLastSuggestionTime
	lastSuggestion := lastSuggestionPrim.Time()
	refreshTime := time.Date(lastSuggestion.Year(), lastSuggestion.Month(), lastSuggestion.Day(), 23, 59, 59, 0, time.FixedZone("", 0))

	timeNow := api.GetCurrentLocalizedTime(timezoneOffset)

	if timeNow.Sub(refreshTime) > 0 && user.GPTSuggestionsLeft != constants.MAX_OVERVIEW_SUGGESTION {
		_, err := database.GetUserCollection(api.DB).UpdateOne(
			context.Background(),
			bson.M{"_id": user.ID},
			bson.M{"$set": bson.M{
				"gpt_suggestions_left": constants.MAX_OVERVIEW_SUGGESTION,
			}},
		)
		if err != nil {
			api.Logger.Error().Err(err).Msg("failed to update suggestions left")
			return 0, err
		}
		return constants.MAX_OVERVIEW_SUGGESTION, nil
	}

	return user.GPTSuggestionsLeft, nil
}

func sanitizeGPTString(name string) string {
	// from https://www.golangprograms.com/how-to-remove-special-characters-from-a-string-in-golang.html
	// remove special characters from the string to prevent prompt hacking
	sanitized := regexp.MustCompile(`[^a-zA-Z0-9 ]+`).ReplaceAllString(name, "")
	return sanitized
}

func (api *API) decrementGPTRemainingByOne(user *database.User, timezoneOffset time.Duration) error {
	timeNow := api.GetCurrentLocalizedTime(timezoneOffset)

	_, err := database.GetUserCollection(api.DB).UpdateOne(
		context.Background(),
		bson.M{"_id": user.ID},
		bson.M{
			"$inc": bson.M{
				"gpt_suggestions_left": -1,
			},
			"$set": bson.M{
				"gpt_last_suggestion_time": primitive.NewDateTimeFromTime(timeNow),
			}},
	)
	return err
}
