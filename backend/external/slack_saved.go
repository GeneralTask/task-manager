package external

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/rs/zerolog/log"
	"go.mongodb.org/mongo-driver/bson/primitive"
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

func (slackTask SlackSavedTaskSource) GetEmails(userID primitive.ObjectID, accountID string, latestHistoryID uint64, result chan<- EmailResult, fullRefresh bool) {
	result <- emptyEmailResult(nil)
}

func (slackTask SlackSavedTaskSource) GetEvents(userID primitive.ObjectID, accountID string, startTime time.Time, endTime time.Time, result chan<- CalendarResult) {
	result <- emptyCalendarResult(nil)
}

func (slackTask SlackSavedTaskSource) GetTasks(userID primitive.ObjectID, accountID string, result chan<- TaskResult) {
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		log.Error().Err(err).Msg("failed to connect to db")
		result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_SLACK_SAVED)
		return
	}
	defer dbCleanup()

	// TODO: switch back to Slack library once https://github.com/slack-go/slack/pull/1069 lands and is included in a release
	client := getSlackHttpClient(db, userID, accountID)
	savedMessagesURL := "https://slack.com/api/stars.list"
	if slackTask.Slack.Config.ConfigValues.SavedMessagesURL != nil {
		savedMessagesURL = *slackTask.Slack.Config.ConfigValues.SavedMessagesURL
		client = http.DefaultClient
	}
	var savedMessages slackSavedMessagesResponse
	err = getJSON(client, savedMessagesURL, &savedMessages)
	if err != nil {
		log.Error().Err(err).Msg("failed to fetch saved items")
		result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_SLACK_SAVED)
		return
	}

	var tasks []*database.Item
	for _, messageItem := range savedMessages.Items {
		task := &database.Item{
			TaskBase: database.TaskBase{
				UserID:          userID,
				IDExternal:      messageItem.Message.ClientMsgID,
				IDTaskSection:   constants.IDTaskSectionDefault,
				Deeplink:        messageItem.Message.Permalink,
				SourceID:        TASK_SOURCE_ID_SLACK_SAVED,
				Title:           messageItem.Message.Text,
				SourceAccountID: accountID,
			},
			TaskType: database.TaskType{
				IsTask: true,
			},
		}
		isCompleted := false
		dbTask, err := database.UpdateOrCreateItem(
			db,
			userID,
			task.IDExternal,
			task.SourceID,
			task,
			database.TaskItemChangeableFields{
				IsCompleted: &isCompleted,
			},
			nil,
			false,
		)
		if err != nil {
			log.Error().Err(err).Msg("failed to save slack saved message in DB")
			continue
		}
		task.HasBeenReordered = dbTask.HasBeenReordered
		task.ID = dbTask.ID
		task.IDOrdering = dbTask.IDOrdering
		task.IDTaskSection = dbTask.IDTaskSection
		task.TimeAllocation = dbTask.TimeAllocation
		// we want local (on GT side) title and body changes to persist
		task.Title = dbTask.Title
		task.TaskBase.Body = dbTask.TaskBase.Body
		tasks = append(tasks, task)
	}

	result <- TaskResult{
		Tasks: tasks,
	}
}

func (slackTask SlackSavedTaskSource) GetPullRequests(userID primitive.ObjectID, accountID string, result chan<- PullRequestResult) {
	result <- emptyPullRequestResult(nil)
}

func (slackTask SlackSavedTaskSource) ModifyTask(userID primitive.ObjectID, accountID string, issueID string, updateFields *database.TaskItemChangeableFields) error {
	return errors.New("has not been implemented yet")
}

func (slackTask SlackSavedTaskSource) Reply(userID primitive.ObjectID, accountID string, messageID primitive.ObjectID, emailContents EmailContents) error {
	return errors.New("cannot reply to an Slack task")
}

func (slackTask SlackSavedTaskSource) SendEmail(userID primitive.ObjectID, accountID string, email EmailContents) error {
	return errors.New("cannot send email for Slack source")
}

func (slackTask SlackSavedTaskSource) CreateNewTask(userID primitive.ObjectID, accountID string, task TaskCreationObject) (primitive.ObjectID, error) {
	taskSection := constants.IDTaskSectionDefault
	if task.IDTaskSection != primitive.NilObjectID {
		taskSection = task.IDTaskSection
	}
	newTask := database.Item{
		TaskBase: database.TaskBase{
			UserID:          userID,
			IDTaskSection:   taskSection,
			SourceID:        TASK_SOURCE_ID_SLACK_SAVED,
			Title:           task.Title,
			Body:            task.Body,
			SourceAccountID: accountID,
		},
		TaskType: database.TaskType{
			IsTask: true,
		},
		SlackMessageParams: database.SlackMessageParams{
			Channel:  task.SlackMessageParams.Channel,
			SenderID: task.SlackMessageParams.SenderID,
			Team:     task.SlackMessageParams.Team,
			TimeSent: task.SlackMessageParams.TimeSent,
		},
	}

	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return primitive.NilObjectID, err
	}
	defer dbCleanup()
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
