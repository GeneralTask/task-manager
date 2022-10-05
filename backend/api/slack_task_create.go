package api

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io/ioutil"
	"net/http"
	"strings"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/GeneralTask/task-manager/backend/logging"
	"github.com/gin-gonic/gin"
	"github.com/slack-go/slack"
	"golang.org/x/oauth2"
)

const (
	SLACK_MESSAGE_ACTION  = "message_action"
	SLACK_VIEW_SUBMISSION = "view_submission"
	MESSAGE_TYPE_DM       = "directmessage"
)

type SlackResponse struct {
	Ok    bool   `json:"ok"`
	Error string `json:"error"`
}

type SlackRequestParams struct {
	Type      string    `json:"type"`
	TriggerID string    `json:"trigger_id"`
	View      SlackView `json:"view"`
}

type SlackView struct {
	PrivateMetadata string           `json:"private_metadata"`
	State           SlackStateValues `json:"state"`
}

type SlackStateValues struct {
	Values SlackBlockValues `json:"values"`
}

type SlackBlockValues struct {
	TaskTitle   SlackTaskTitle   `json:"task_title"`
	TaskDetails SlackTaskDetails `json:"task_details"`
}

type SlackTaskTitle struct {
	TitleInput SlackInputValue `json:"task_title_input"`
}

type SlackTaskDetails struct {
	DetailsInput SlackInputValue `json:"task_details_input"`
}

type SlackInputValue struct {
	Value string `json:"value"`
}

// SlackTaskCreate   godoc
// @Summary      Creates task from Slack message
// @Description  Payload specifies the type of request
// @Tags         users
// @Accept       json
// @Produce      json
// @Param        X-Slack-Request-Timestamp   header     string  true  "Source ID"
// @Param        X-Slack-Signature   	     header     string  true  "Oauth Code"
// @Param        payload  				     body       SlackRequestParams 			 true "Slack message payload"
// @Param        payload  				     body       external.SlackMessageParams  true "Slack message payload"
// @Success      200 {object} string "success"
// @Failure      400 {object} string "invalid params"
// @Failure      500 {object} string "internal server error"
// @Failure      501 {object} string "invalid method"
// @Failure      503 {object} string "unable to create task"
// @Router       /tasks/create_external/slack/ [post]
func (api *API) SlackTaskCreate(c *gin.Context) {
	sourceID := external.TASK_SOURCE_ID_SLACK_SAVED
	// make request body readable
	body, _ := ioutil.ReadAll(c.Request.Body)
	// this is required, as the first write fully consumes the body
	// the Form in the body is required for payload extraction
	c.Request.Body = ioutil.NopCloser(bytes.NewBuffer(body))

	logger := logging.GetSentryLogger()

	// verification for security
	slackSigningSecret := config.GetConfigValue("SLACK_SIGNING_SECRET")
	timestamp := c.Request.Header.Get("X-Slack-Request-Timestamp")
	signature := c.Request.Header.Get("X-Slack-Signature")
	err := authenticateSlackRequest(slackSigningSecret, timestamp, signature, string(body))
	if err != nil {
		c.JSON(400, gin.H{"detail": "signing secret invalid"})
		return
	}

	// gather payload from the request
	formData := []byte{}
	c.Request.ParseForm()
	if val, ok := c.Request.Form["payload"]; ok {
		if len(val) > 0 {
			formData = []byte(val[0])
		}
	}
	if len(formData) <= 0 {
		c.JSON(400, gin.H{"detail": "payload not included in request"})
		return
	}

	// unmarshal into request params for type and trigger id
	var requestParams SlackRequestParams
	err = json.Unmarshal(formData, &requestParams)
	if err != nil {
		c.JSON(400, gin.H{"detail": "unable to process request payload"})
		return
	}

	// unmarshal data about the message itself (most fields will be null on form submission)
	var slackParams database.SlackMessageParams
	err = json.Unmarshal(formData, &slackParams)
	if err != nil {
		c.JSON(400, gin.H{"detail": "unable to process task payload"})
		return
	}

	// extract external token for task and modal creation
	externalID := external.GenerateSlackUserID(slackParams.Team.ID, slackParams.User.ID)
	externalToken, err := database.GetExternalToken(api.DB, externalID, sourceID)
	if err != nil {
		logger.Error().Err(err).Msg("error getting external token")
		Handle500(c)
		return
	}

	taskSourceResult, err := api.ExternalConfig.GetSourceResult(sourceID)
	if err != nil {
		logger.Error().Err(err).Msg("no Slack source result found")
		Handle404(c)
		return
	}

	// require special override because in separate package
	override := api.ExternalConfig.SlackOverrideURL
	userID := externalToken.UserID
	source := taskSourceResult.Source.(external.SlackSavedTaskSource)
	if override != "" {
		source.Slack.Config.ConfigValues.OverrideURL = &override
	}

	// if message_action, this means that the modal must be created
	if requestParams.Type == SLACK_MESSAGE_ACTION {
		// ensuring that we can create the modal (by truncating long messages)
		// Slack only supports modals of length 3000
		if len(slackParams.Message.Text) > 800 {
			slackParams.Message.Text = slackParams.Message.Text[:800]
		}

		// encoding body to put into request
		// we do this as the form submission does not return the same values

		// thus, in order to keep context about the message:
		// we must marshal, store in string, and unmarshal on return
		jsonBytes, err := json.Marshal(slackParams)
		if err != nil {
			logger.Error().Err(err).Msg("error marshaling Slack message data")
			Handle500(c)
			return
		}
		modalMetadata := strings.Replace(string(jsonBytes), "\"", "\\\"", -1)

		title, err := getSlackMessageTitle(source, slackParams, externalToken)
		if err != nil {
			logger.Error().Err(err).Msg("error parsing Slack timestamp")
			Handle500(c)
			return
		}

		modalJSON := external.GetSlackModal(requestParams.TriggerID, modalMetadata, title)

		var oauthToken oauth2.Token
		err = json.Unmarshal([]byte(externalToken.Token), &oauthToken)
		if err != nil {
			logger.Error().Err(err).Msg("error unmarshaling external token")
			Handle500(c)
			return
		}

		// Golang Slack API cannot handle optional fields for modals
		// thus we make this request manually
		// overrides for testing
		url := slack.APIURL + "views.open"
		override := api.ExternalConfig.SlackOverrideURL
		if override != "" {
			url = override
		}
		request, err := http.NewRequest("POST", url, bytes.NewBuffer(modalJSON))
		request.Header.Set("Content-type", "application/json")
		request.Header.Set("Authorization", "Bearer "+oauthToken.AccessToken)
		client := &http.Client{}
		resp, err := client.Do(request)
		if err != nil {
			logger.Error().Err(err).Msg("error sending Slack modal request")
			Handle500(c)
			return
		}
		body, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			logger.Error().Err(err).Msg("error reading Slack response")
			Handle500(c)
			return
		}

		var modalResponse SlackResponse
		err = json.Unmarshal([]byte(body), &modalResponse)
		if err != nil {
			logger.Error().Err(err).Msg("error unmarshaling Slack modalResponse")
			Handle500(c)
			return
		} else if !modalResponse.Ok {
			logger.Error().Err(errors.New(modalResponse.Error)).Msg("modal response not ok")
			Handle500(c)
			return
		}
		c.JSON(200, gin.H{})
		return
	} else if requestParams.Type == SLACK_VIEW_SUBMISSION {
		// unmarshal previously stored data for message context
		var slackMetadataParams database.SlackMessageParams
		err = json.Unmarshal([]byte(requestParams.View.PrivateMetadata), &slackMetadataParams)
		if err != nil {
			logger.Error().Err(err).Msg("error unmarshaling Slack message data")
			Handle500(c)
			return
		}

		title := requestParams.View.State.Values.TaskTitle.TitleInput.Value
		if title == "" {
			title = slackMetadataParams.Message.Text
		}
		details := requestParams.View.State.Values.TaskDetails.DetailsInput.Value
		taskCreationObject := external.TaskCreationObject{
			Title:              title,
			SlackMessageParams: slackMetadataParams,
			IDTaskSection:      constants.IDTaskSectionDefault,
		}
		if details != "" {
			taskCreationObject.Body = details
		}

		_, err = source.CreateNewTask(api.DB, userID, externalID, taskCreationObject)
		if err != nil {
			c.JSON(503, gin.H{"detail": "failed to create task"})
			return
		}

		// send ephemeral response
		url := slackMetadataParams.ResponseURL
		if override != "" {
			url = override
		}
		err = external.SendConfirmationResponse(*externalToken, url)
		if err != nil {
			c.JSON(500, gin.H{"detail": "failed to send ephemeral response"})
		}

		c.JSON(200, gin.H{})
		return
	}

	logger.Error().Err(err).Msg("message type not recognized")
	c.JSON(501, gin.H{"detail": "method not recognized"})
}

func authenticateSlackRequest(signingSecret string, timestamp string, signature string, body string) error {
	// as per: https://api.slack.com/authentication/verifying-requests-from-slack
	secretConstructor := "v0:" + timestamp + ":" + body
	hash := hmac.New(sha256.New, []byte(signingSecret))
	hash.Write([]byte(secretConstructor))
	computed := []byte("v0=" + hex.EncodeToString(hash.Sum(nil)))
	if !hmac.Equal(computed, []byte(signature)) {
		return errors.New("invalid signature")
	}
	return nil
}

func getSlackMessageTitle(slackTask external.SlackSavedTaskSource, messageParams database.SlackMessageParams, externalToken *database.ExternalAPIToken) (string, error) {
	title := ""

	var oauthToken oauth2.Token
	json.Unmarshal([]byte(externalToken.Token), &oauthToken)

	client := slack.New(oauthToken.AccessToken)
	config := slackTask.Slack.Config.ConfigValues
	if config.OverrideURL != nil {
		client = slack.New(oauthToken.AccessToken, slack.OptionAPIURL(*slackTask.Slack.Config.ConfigValues.OverrideURL))
	}

	usernameChan := make(chan string)
	go external.GetSlackUsername(client, messageParams.Message.User, usernameChan)
	username := <-usernameChan
	channel := "#" + messageParams.Channel.Name
	if channel == "#"+MESSAGE_TYPE_DM {
		channel = "a direct message"
	}

	title = title + username + " in " + channel

	messageText := messageParams.Message.Text
	if len(messageText) > 50 {
		messageText = messageParams.Message.Text[:50] + "..."
	}
	title = title + ": " + messageText
	return title, nil
}
