package api

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io/ioutil"
	"net/http"
	"time"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/GeneralTask/task-manager/backend/logging"
	"github.com/gin-gonic/gin"
	"github.com/slack-go/slack"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/oauth2"
)

const (
	SLACK_MESSAGE_ACTION  = "message_action"
	SLACK_VIEW_SUBMISSION = "view_submission"
)

type TaskCreateParams struct {
	AccountID     string     `json:"account_id"`
	Title         string     `json:"title" binding:"required"`
	Body          string     `json:"body"`
	DueDate       *time.Time `json:"due_date"`
	TimeDuration  *int       `json:"time_duration"`
	IDTaskSection *string    `json:"id_task_section"`
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
// @Param        payload  				     body       database.SlackMessageParams  true "Slack message payload"
// @Success      200 {object} string "success"
// @Failure      400 {object} string "invalid params"
// @Failure      500 {object} string "internal server error"
// @Failure      501 {object} string "invalid method"
// @Failure      503 {object} string "unable to create task"
// @Router       /tasks/create_external/slack/ [post]
func (api *API) SlackTaskCreate(c *gin.Context) {
	sourceID := external.TASK_SOURCE_ID_SLACK_SAVED
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()

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
	err = authenticateSlackRequest(slackSigningSecret, timestamp, signature, string(body))
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
	externalToken, err := database.GetExternalToken(db, externalID, sourceID)
	if err != nil {
		logger.Error().Err(err).Msg("error getting external token")
		Handle500(c)
		return
	}

	// if message_action, this means that the modal must be created
	if requestParams.Type == SLACK_MESSAGE_ACTION {
		// encoding body to put into request
		// we do this as the form submission does not return the same values

		// thus, in order to keep context about the message:
		// we must marshal, store in string, and unmarshal on return
		jsonBytes, err := json.Marshal(string(formData))
		if err != nil {
			logger.Error().Err(err).Msg("error marshaling Slack message data")
			Handle500(c)
			return
		}
		modalJSON := external.GetSlackModal(requestParams.TriggerID, string(jsonBytes), slackParams.Message.Text)

		var oauthToken oauth2.Token
		err = json.Unmarshal([]byte(externalToken.Token), &oauthToken)
		if err != nil {
			logger.Error().Err(err).Msg("error unmarshaling external token")
			Handle500(c)
			return
		}

		// Golang Slack API cannot handle optional fields for modals
		// thus we make this request manually
		request, err := http.NewRequest("POST", slack.APIURL+"views.open", bytes.NewBuffer(modalJSON))
		request.Header.Set("Content-type", "application/json")
		request.Header.Set("Authorization", "Bearer "+oauthToken.AccessToken)
		client := &http.Client{}
		_, err = client.Do(request)
		if err != nil {
			logger.Error().Err(err).Msg("error sending Slack modal request")
			Handle500(c)
			return
		}
		c.JSON(200, gin.H{})
		return
	} else if requestParams.Type == SLACK_VIEW_SUBMISSION {
		taskSourceResult, err := api.ExternalConfig.GetSourceResult(sourceID)
		if err != nil {
			logger.Error().Err(err).Msg("no Slack source result found")
			Handle404(c)
			return
		}

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

		userID := externalToken.UserID
		_, err = taskSourceResult.Source.CreateNewTask(userID, externalID, taskCreationObject)
		if err != nil {
			c.JSON(503, gin.H{"detail": "failed to create task"})
			return
		}
		c.JSON(200, gin.H{})
		return
	}

	logger.Error().Err(err).Msg("message type not recognized")
	c.JSON(501, gin.H{"detail": "method not recognized"})
}

func (api *API) TaskCreate(c *gin.Context) {
	parentCtx := c.Request.Context()
	sourceID := c.Param("source_id")
	taskSourceResult, err := api.ExternalConfig.GetSourceResult(sourceID)
	if err != nil || !taskSourceResult.Details.CanCreateTask {
		Handle404(c)
		return
	}

	var taskCreateParams TaskCreateParams
	err = c.BindJSON(&taskCreateParams)
	if err != nil {
		c.JSON(400, gin.H{"detail": "invalid or missing parameter"})
		return
	}

	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()

	userIDRaw, _ := c.Get("user")
	userID := userIDRaw.(primitive.ObjectID)

	IDTaskSection := primitive.NilObjectID
	if taskCreateParams.IDTaskSection != nil {
		IDTaskSection, err = getValidTaskSection(*taskCreateParams.IDTaskSection, userID, db)
		if err != nil {
			c.JSON(400, gin.H{"detail": "'id_task_section' is not a valid ID"})
			return
		}
	}

	if sourceID != external.TASK_SOURCE_ID_GT_TASK {
		externalAPICollection := database.GetExternalTokenCollection(db)
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		count, err := externalAPICollection.CountDocuments(
			dbCtx,
			bson.M{"$and": []bson.M{
				{"account_id": taskCreateParams.AccountID},
				{"source_id": sourceID},
				{"user_id": userID},
			}},
		)
		if err != nil || count <= 0 {
			c.JSON(404, gin.H{"detail": "account ID not found"})
			return
		}
	} else {
		// default is currently the only acceptable accountID for general task task source
		taskCreateParams.AccountID = external.GeneralTaskDefaultAccountID
	}

	var timeAllocation *int64
	if taskCreateParams.TimeDuration != nil {
		timeAllocationTemp := (time.Duration(*taskCreateParams.TimeDuration) * time.Second).Nanoseconds()
		timeAllocation = &timeAllocationTemp
	}
	taskCreationObject := external.TaskCreationObject{
		Title:          taskCreateParams.Title,
		Body:           taskCreateParams.Body,
		DueDate:        taskCreateParams.DueDate,
		TimeAllocation: timeAllocation,
		IDTaskSection:  IDTaskSection,
	}
	taskID, err := taskSourceResult.Source.CreateNewTask(userID, taskCreateParams.AccountID, taskCreationObject)
	if err != nil {
		c.JSON(503, gin.H{"detail": "failed to create task"})
		return
	}
	c.JSON(200, gin.H{"task_id": taskID})
}

func getValidTaskSection(taskSectionIDHex string, userID primitive.ObjectID, db *mongo.Database) (primitive.ObjectID, error) {
	IDTaskSection, err := primitive.ObjectIDFromHex(taskSectionIDHex)
	if err != nil {
		return primitive.NilObjectID, errors.New("malformatted task section")
	}
	taskSectionCollection := database.GetTaskSectionCollection(db)
	dbCtx, cancel := context.WithTimeout(context.Background(), constants.DatabaseTimeout)
	defer cancel()
	count, err := taskSectionCollection.CountDocuments(dbCtx, bson.M{"$and": []bson.M{{"user_id": userID}, {"_id": IDTaskSection}}})
	if (err != nil || count == int64(0)) &&
		IDTaskSection != constants.IDTaskSectionDefault {
		return primitive.NilObjectID, errors.New("task section ID not found")
	}
	return IDTaskSection, nil
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
