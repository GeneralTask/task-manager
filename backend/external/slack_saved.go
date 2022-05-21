package external

import (
	"errors"
	"fmt"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/rs/zerolog/log"
	"github.com/slack-go/slack"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type SlackSavedTaskSource struct {
	Slack SlackService
}

func (slackTask SlackSavedTaskSource) GetEmails(userID primitive.ObjectID, accountID string, result chan<- EmailResult, fullRefresh bool) {
	result <- emptyEmailResult(nil)
}

func (slackTask SlackSavedTaskSource) GetEvents(userID primitive.ObjectID, accountID string, startTime time.Time, endTime time.Time, result chan<- CalendarResult) {
	result <- emptyCalendarResult(nil)
}

func (slackTask SlackSavedTaskSource) GetTasks(userID primitive.ObjectID, accountID string, result chan<- TaskResult) {
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		log.Error().Err(err).Msg("failed to connect to db")
		result <- emptyTaskResult(nil)
		return
	}
	defer dbCleanup()

	externalToken, err := getExternalToken(db, userID, accountID, TASK_SERVICE_ID_SLACK)
	if err != nil {
		log.Error().Err(err).Msg("failed to fetch token")
		result <- emptyTaskResult(nil)
		return
	}

	token := extrackOauthToken(*externalToken)
	fmt.Println("OH WOW", token.AccessToken)
	api := slack.New(token.AccessToken)
	if slackTask.Slack.Config.ConfigValues.SavedMessagesURL != nil {
		api = slack.New(token.AccessToken, slack.OptionAPIURL(*slackTask.Slack.Config.ConfigValues.SavedMessagesURL))
	}
	savedMessages, _, err := api.ListStars(slack.NewStarsParameters())
	if err != nil {
		log.Error().Err(err).Msg("failed to fetch saved items")
		result <- emptyTaskResult(nil)
		return
	}
	fmt.Println("WOW IT WORKS", len(savedMessages))

	var tasks []*database.Item
	for _, messageItem := range savedMessages {
		if messageItem.Message == nil {
			fmt.Println("message missing!")
			continue
		}
		task := &database.Item{
			TaskBase: database.TaskBase{
				UserID:          userID,
				IDExternal:      messageItem.Message.ClientMsgID,
				IDTaskSection:   constants.IDTaskSectionDefault,
				Deeplink:        "https://apple.com/",
				SourceID:        TASK_SOURCE_ID_SLACK_SAVED,
				Title:           messageItem.Message.Text,
				SourceAccountID: accountID,
			},
			TaskType: database.TaskType{
				IsTask: true,
			},
		}
		isCompleted := false
		dbTask, err := database.UpdateOrCreateTask(
			db,
			userID,
			task.IDExternal,
			task.SourceID,
			task,
			database.TaskChangeableFields{
				IsCompleted: &isCompleted,
			},
			nil,
			false,
		)
		if err != nil {
			fmt.Println("db update fail!", err)
			continue
		}
		task.HasBeenReordered = dbTask.HasBeenReordered
		task.ID = dbTask.ID
		task.IDOrdering = dbTask.IDOrdering
		task.IDTaskSection = dbTask.IDTaskSection
		task.TimeAllocation = dbTask.TimeAllocation
		tasks = append(tasks, task)
	}

	result <- TaskResult{
		Tasks: tasks,
	}
}

func (slackTask SlackSavedTaskSource) GetPullRequests(userID primitive.ObjectID, accountID string, result chan<- PullRequestResult) {
	result <- emptyPullRequestResult(nil)
}

func (slackTask SlackSavedTaskSource) ModifyTask(userID primitive.ObjectID, accountID string, issueID string, updateFields *database.TaskChangeableFields) error {
	return errors.New("has not been implemented yet")
}

func (slackTask SlackSavedTaskSource) Reply(userID primitive.ObjectID, accountID string, messageID primitive.ObjectID, emailContents EmailContents) error {
	return errors.New("cannot reply to an Slack task")
}

func (slackTask SlackSavedTaskSource) SendEmail(userID primitive.ObjectID, accountID string, email EmailContents) error {
	return errors.New("cannot send email for Slack source")
}

func (slackTask SlackSavedTaskSource) CreateNewTask(userID primitive.ObjectID, accountID string, task TaskCreationObject) error {
	return errors.New("cannot create new Slack task")
}

func (slackTask SlackSavedTaskSource) CreateNewEvent(userID primitive.ObjectID, accountID string, event EventCreateObject) error {
	return errors.New("has not been implemented yet")
}

func (slackTask SlackSavedTaskSource) ModifyMessage(userID primitive.ObjectID, accountID string, emailID string, updateFields *database.MessageChangeable) error {
	return nil
}

func (slackTask SlackSavedTaskSource) ModifyThread(userID primitive.ObjectID, accountID string, threadID primitive.ObjectID, isUnread *bool) error {
	return nil
}
