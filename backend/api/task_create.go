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
	"time"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type TaskCreateParams struct {
	AccountID     string     `json:"account_id"`
	Title         string     `json:"title" binding:"required"`
	Body          string     `json:"body"`
	DueDate       *time.Time `json:"due_date"`
	TimeDuration  *int       `json:"time_duration"`
	IDTaskSection *string    `json:"id_task_section"`
}

func (api *API) ExternalTaskCreate(c *gin.Context) {
	sourceID := c.Param("source_id")

	// only support slack creation for the time being
	if sourceID != external.TASK_SOURCE_ID_SLACK_SAVED {
		Handle404(c)
		return
	}
	taskSourceResult, err := api.ExternalConfig.GetTaskSourceResult(sourceID)
	if err != nil || !taskSourceResult.Details.CanCreateTask {
		Handle404(c)
		return
	}

	// make request body readable
	body, _ := ioutil.ReadAll(c.Request.Body) // after this operation body will equal 0
	// Restore the io.ReadCloser to request
	c.Request.Body = ioutil.NopCloser(bytes.NewBuffer(body))

	// verification for security
	slackSigningSecret := config.GetConfigValue("SLACK_SIGNING_SECRET")
	header := c.Request.Header.Get("X-Slack-Request-Timestamp")
	signature := c.Request.Header.Get("X-Slack-Signature")

	// as per: https://api.slack.com/authentication/verifying-requests-from-slack
	secretConstructor := "v0:" + header + ":" + string(body)
	hash := hmac.New(sha256.New, []byte(slackSigningSecret))
	hash.Write([]byte(secretConstructor))
	computed := []byte("v0=" + hex.EncodeToString(hash.Sum(nil)))
	if !hmac.Equal(computed, []byte(signature)) {
		c.JSON(400, gin.H{"detail": "signing secret invalid."})
		return
	}

	// process payload information
	var slackParams external.SlackShortcutRequest
	c.Request.ParseForm()
	formData := []byte(c.Request.Form["payload"][0])
	err = json.Unmarshal(formData, &slackParams)
	if err != nil {
		c.JSON(400, gin.H{"detail": "unable to process task payload."})
		return
	}

	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()

	externalID := slackParams.Team.Id + "-" + slackParams.User.ID
	externalToken, err := database.GetExternalToken(db, externalID, sourceID)
	userID := externalToken.UserID

	IDTaskSection := primitive.NilObjectID

	taskCreationObject := external.TaskCreationObject{
		Title:         slackParams.Message.Text,
		TimeSent:      slackParams.Message.TimeSent,
		Channel:       slackParams.Channel.Name,
		SenderID:      slackParams.Message.User,
		Team:          slackParams.Team.Domain,
		IDTaskSection: IDTaskSection,
	}
	taskID, err := taskSourceResult.Source.CreateNewTask(userID, externalID, taskCreationObject)
	if err != nil {
		c.JSON(503, gin.H{"detail": "failed to create task"})
		return
	}
	c.JSON(200, gin.H{"task_id": taskID})
}

func (api *API) TaskCreate(c *gin.Context) {
	parentCtx := c.Request.Context()
	sourceID := c.Param("source_id")
	taskSourceResult, err := api.ExternalConfig.GetTaskSourceResult(sourceID)
	if err != nil || !taskSourceResult.Details.CanCreateTask {
		Handle404(c)
		return
	}

	var taskCreateParams TaskCreateParams
	err = c.BindJSON(&taskCreateParams)
	if err != nil {
		c.JSON(400, gin.H{"detail": "invalid or missing parameter."})
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
