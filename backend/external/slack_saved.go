package external

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/slack-go/slack"
	"golang.org/x/oauth2"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/rs/zerolog/log"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type slackSavedMessagesResponse struct {
	Items []slackItem `json:"items"`
}

type slackItem struct {
	Message slackMessage `json:"message"`
}

type slackMessage struct {
	ClientMsgID string `json:"client_msg_id"`
	Text        string `json:"text"`
	Permalink   string `json:"permalink"`
}

type SlackSavedTaskSource struct {
	Slack SlackService
}

type SlackAdditionalInformation struct {
	Username string
	Deeplink string
}

func (slackTask SlackSavedTaskSource) GetEmails(userID primitive.ObjectID, accountID string, latestHistoryID uint64, result chan<- EmailResult, fullRefresh bool) {
	result <- emptyEmailResult(nil)
}

func (slackTask SlackSavedTaskSource) GetEvents(userID primitive.ObjectID, accountID string, startTime time.Time, endTime time.Time, result chan<- CalendarResult) {
	result <- emptyCalendarResult(nil)
}

func (slackTask SlackSavedTaskSource) GetTasks(userID primitive.ObjectID, accountID string, result chan<- TaskResult) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		log.Error().Err(err).Msg("failed to connect to db")
		result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_SLACK_SAVED)
	}
	defer dbCleanup()

	taskCollection := database.GetTaskCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()

	cursor, err := taskCollection.Find(
		dbCtx,
		bson.M{"$and": []bson.M{
			{"user_id": userID},
			{"source_id": TASK_SOURCE_ID_SLACK_SAVED},
			{"source_account_id": accountID},
			{"is_completed": false},
		}},
	)
	var tasks []*database.Item
	if err != nil || cursor.All(dbCtx, &tasks) != nil {
		log.Error().Err(err).Msg("failed to fetch slack tasks")
		result <- emptyTaskResult(err)
		return
	}
	result <- TaskResult{Tasks: tasks, Error: nil}
}

func (slackTask SlackSavedTaskSource) GetPullRequests(userID primitive.ObjectID, accountID string, result chan<- PullRequestResult) {
	result <- emptyPullRequestResult(nil)
}

func (slackTask SlackSavedTaskSource) ModifyTask(userID primitive.ObjectID, accountID string, issueID string, updateFields *database.TaskItemChangeableFields, task *database.Item) error {
	return nil
}

func (slackTask SlackSavedTaskSource) Reply(userID primitive.ObjectID, accountID string, messageID primitive.ObjectID, emailContents EmailContents) error {
	return errors.New("cannot reply to an Slack task")
}

func (slackTask SlackSavedTaskSource) SendEmail(userID primitive.ObjectID, accountID string, email EmailContents) error {
	return errors.New("cannot send email for Slack source")
}

func (slackTask SlackSavedTaskSource) CreateNewTask(userID primitive.ObjectID, accountID string, task TaskCreationObject) (primitive.ObjectID, error) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return primitive.NilObjectID, err
	}
	defer dbCleanup()

	taskSection := constants.IDTaskSectionDefault
	if task.IDTaskSection != primitive.NilObjectID {
		taskSection = task.IDTaskSection
	}

	slackAdditionalInformation, err := GetSlackAdditionalInformation(db, userID, accountID, task.SlackMessageParams)
	if err != nil {
		log.Error().Err(err).Msg("failed to fetch Slack message params")
	}

	newTask := database.Item{
		TaskBase: database.TaskBase{
			UserID:          userID,
			IDTaskSection:   taskSection,
			SourceID:        TASK_SOURCE_ID_SLACK_SAVED,
			Title:           task.Title,
			Body:            task.Body,
			SourceAccountID: accountID,
			Deeplink:        slackAdditionalInformation.Deeplink,
			Sender:          slackAdditionalInformation.Username,
		},
		TaskType: database.TaskType{
			IsTask: true,
		},
		SlackMessageParams: database.SlackMessageParams{
			Channel: task.SlackMessageParams.Channel,
			User:    task.SlackMessageParams.User,
			Team:    task.SlackMessageParams.Team,
			Message: task.SlackMessageParams.Message,
		},
	}

	taskCollection := database.GetTaskCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	insertResult, err := taskCollection.InsertOne(dbCtx, newTask)
	return insertResult.InsertedID.(primitive.ObjectID), err
}

func (slackTask SlackSavedTaskSource) CreateNewEvent(userID primitive.ObjectID, accountID string, event EventCreateObject) error {
	return errors.New("has not been implemented yet")
}

func (slackTask SlackSavedTaskSource) ModifyMessage(userID primitive.ObjectID, accountID string, emailID string, updateFields *database.MessageChangeable) error {
	return nil
}

func (slackTask SlackSavedTaskSource) ModifyThread(userID primitive.ObjectID, accountID string, threadID primitive.ObjectID, isUnread *bool, isArchived *bool) error {
	return nil
}

func GenerateSlackUserID(teamID string, userID string) string {
	return teamID + "-" + userID
}

func GetSlackAdditionalInformation(db *mongo.Database, userID primitive.ObjectID, accountID string, slackParams database.SlackMessageParams) (SlackAdditionalInformation, error) {
	externalToken, err := getExternalToken(db, userID, accountID, TASK_SERVICE_ID_SLACK)
	if err != nil {
		return SlackAdditionalInformation{}, err
	}

	var oauthToken oauth2.Token
	json.Unmarshal([]byte(externalToken.Token), &oauthToken)

	client := slack.New(oauthToken.AccessToken)
	deeplinkChan := make(chan string)
	usernameChan := make(chan string)

	go getSlackDeeplink(client, slackParams.Channel.ID, slackParams.Message.TimeSent, deeplinkChan)
	go getSlackUsername(client, slackParams.Message.User, usernameChan)

	return SlackAdditionalInformation{
		Deeplink: <-deeplinkChan,
		Username: <-usernameChan,
	}, nil
}

func getSlackDeeplink(client *slack.Client, channelID string, ts string, result chan<- string) {
	if channelID == "" || ts == "" {
		result <- ""
		return
	}
	params := slack.PermalinkParameters{
		Channel: channelID,
		Ts:      ts,
	}
	permalink, err := client.GetPermalink(&params)
	if err != nil {
		log.Error().Err(err).Msg("failed to fetch Slack message permalink")
		result <- ""
		return
	}
	result <- permalink
}

func getSlackUsername(client *slack.Client, userID string, result chan<- string) {
	if userID == "" {
		result <- ""
		return
	}
	userProfile, err := client.GetUserInfo(userID)
	if err != nil {
		log.Error().Err(err).Msg("failed to fetch Slack username")
		result <- ""
		return
	}
	result <- userProfile.Profile.DisplayName
	return
}
