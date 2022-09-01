package api

import (
	"context"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/external"

	"github.com/GeneralTask/task-manager/backend/database"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type TaskSource struct {
	Name          string `json:"name"`
	Logo          string `json:"logo"`
	LogoV2        string `json:"logo_v2"`
	IsCompletable bool   `json:"is_completable"`
	IsReplyable   bool   `json:"is_replyable"`
}

type externalStatus struct {
	State string `json:"state,omitempty"`
	Type  string `json:"type,omitempty"`
}

type TaskResult struct {
	ID                 primitive.ObjectID           `json:"id"`
	IDOrdering         int                          `json:"id_ordering"`
	Source             TaskSource                   `json:"source"`
	Deeplink           string                       `json:"deeplink"`
	Title              string                       `json:"title"`
	Body               string                       `json:"body"`
	Sender             string                       `json:"sender"`
	DueDate            string                       `json:"due_date"`
	TimeAllocation     int64                        `json:"time_allocated"`
	SentAt             string                       `json:"sent_at"`
	IsDone             bool                         `json:"is_done"`
	ExternalStatus     *externalStatus              `json:"external_status,omitempty"`
	Comments           *[]database.Comment          `json:"comments,omitempty"`
	SlackMessageParams *database.SlackMessageParams `json:"slack_message_params,omitempty"`
}

type TaskSection struct {
	ID     primitive.ObjectID `json:"id"`
	Name   string             `json:"name"`
	Tasks  []*TaskResult      `json:"tasks"`
	IsDone bool               `json:"is_done"`
}

type Recipients struct {
	To  []Recipient `json:"to"`
	Cc  []Recipient `json:"cc"`
	Bcc []Recipient `json:"bcc"`
}

type Recipient struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

type TaskGroupType string

const (
	ScheduledTask          TaskGroupType = "scheduled_task"
	UnscheduledGroup       TaskGroupType = "unscheduled_group"
	TaskSectionNameDefault string        = "Default"
	TaskSectionNameDone    string        = "Done"
)

func (api *API) fetchTasks(parentCtx context.Context, db *mongo.Database, userID interface{}) (*[]*database.Task, map[string]bool, error) {
	var tokens []database.ExternalAPIToken
	externalAPITokenCollection := database.GetExternalTokenCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	cursor, err := externalAPITokenCollection.Find(
		dbCtx,
		bson.M{"user_id": userID},
	)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to fetch api tokens")
		return nil, nil, err
	}
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = cursor.All(dbCtx, &tokens)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to iterate through api tokens")
		return nil, nil, err
	}
	// add dummy token for gt_task fetch logic
	tokens = append(tokens, database.ExternalAPIToken{
		AccountID: external.GeneralTaskDefaultAccountID,
		ServiceID: external.TASK_SERVICE_ID_GT,
	})

	taskChannels := []chan external.TaskResult{}
	// Loop through linked accounts and fetch relevant items
	for _, token := range tokens {
		taskServiceResult, err := api.ExternalConfig.GetTaskServiceResult(token.ServiceID)
		if err != nil {
			api.Logger.Error().Err(err).Msg("error loading task service")
			return nil, nil, err
		}
		for _, taskSourceResult := range taskServiceResult.Sources {
			var tasks = make(chan external.TaskResult)
			go taskSourceResult.Source.GetTasks(api.DB, userID.(primitive.ObjectID), token.AccountID, tasks)
			taskChannels = append(taskChannels, tasks)
		}
	}

	tasks := []*database.Task{}
	failedFetchSources := make(map[string]bool)
	for _, taskChannel := range taskChannels {
		taskResult := <-taskChannel
		if taskResult.Error != nil {
			api.Logger.Error().Err(taskResult.Error).Msg("failed to load task source")
			failedFetchSources[taskResult.SourceID] = true
			continue
		}
		tasks = append(tasks, taskResult.Tasks...)
	}
	return &tasks, failedFetchSources, nil
}

func (api *API) adjustForCompletedTasks(
	db *mongo.Database,
	currentTasks *[]database.Task,
	fetchedTasks *[]*database.Task,
	failedFetchSources map[string]bool,
) error {
	// decrements IDOrdering for tasks behind newly completed tasks
	newTaskIDs := make(map[primitive.ObjectID]bool)
	for _, fetchedTask := range *fetchedTasks {
		newTaskIDs[fetchedTask.ID] = true
	}
	// There's a more efficient way to do this but this way is easy to understand
	for _, currentTask := range *currentTasks {
		if currentTask.SourceID == external.TASK_SOURCE_ID_GT_TASK {
			// we don't ever need to mark GT tasks or Gmail tasks as done here as they would have already been marked done
			continue
		}
		if !newTaskIDs[currentTask.ID] && !failedFetchSources[currentTask.SourceID] {
			err := database.MarkCompleteWithCollection(database.GetTaskCollection(db), currentTask.ID)
			if err != nil {
				api.Logger.Error().Err(err).Msg("failed to complete task")
				return err
			}
		}
	}
	return nil
}

func (api *API) adjustForCompletedPullRequests(
	db *mongo.Database,
	currentPullRequests *[]database.PullRequest,
	fetchedPullRequests *[]*database.PullRequest,
	failedFetchSources map[string]bool,
) error {
	newPRIDs := make(map[primitive.ObjectID]bool)
	for _, fetchedPR := range *fetchedPullRequests {
		newPRIDs[fetchedPR.ID] = true
	}

	// There's a more efficient way to do this but this way is easy to understand
	for _, currentPullRequest := range *currentPullRequests {
		if !newPRIDs[currentPullRequest.ID] && !failedFetchSources[currentPullRequest.SourceID] {
			err := database.MarkCompleteWithCollection(database.GetPullRequestCollection(db), currentPullRequest.ID)
			if err != nil {
				api.Logger.Error().Err(err).Msg("failed to complete pull request")
				return err
			}
		}
	}
	return nil
}

func (api *API) updateOrderingIDsV2(db *mongo.Database, tasks *[]*TaskResult) error {
	parentCtx := context.Background()
	tasksCollection := database.GetTaskCollection(db)
	orderingID := 1
	for _, task := range *tasks {
		task.IDOrdering = orderingID
		orderingID += 1
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		res, err := tasksCollection.UpdateOne(
			dbCtx,
			bson.M{"_id": task.ID},
			bson.M{"$set": bson.M{"id_ordering": task.IDOrdering}},
		)
		if err != nil {
			api.Logger.Error().Err(err).Msg("failed to update task ordering ID")
			return err
		}
		if res.MatchedCount != 1 {
			api.Logger.Error().Interface("taskResult", task).Msgf("did not find task to update ordering ID (ID=%v)", task.ID)
		}
	}
	return nil
}

func (api *API) taskBaseToTaskResult(t *database.Task, userID primitive.ObjectID) *TaskResult {
	var dueDate string
	if t.DueDate != nil {
		if t.DueDate.Time().Unix() == int64(0) {
			dueDate = ""
		} else {
			dueDate = t.DueDate.Time().Format("2006-01-02")
		}
	}

	taskSourceResult, err := api.ExternalConfig.GetSourceResult(t.SourceID)
	taskSource := TaskSource{}
	if err == nil {
		taskSource = TaskSource{
			Name:          taskSourceResult.Details.Name,
			Logo:          taskSourceResult.Details.Logo,
			LogoV2:        taskSourceResult.Details.LogoV2,
			IsCompletable: taskSourceResult.Details.IsCompletable,
			IsReplyable:   taskSourceResult.Details.IsReplyable,
		}
	} else {
		api.Logger.Error().Err(err).Msgf("failed to find task source %s", t.SourceID)
	}

	// for null pointer checks
	timeAllocation := int64(0)
	if t.TimeAllocation != nil {
		timeAllocation = *t.TimeAllocation
	}
	completed := false
	if t.IsCompleted != nil {
		completed = *t.IsCompleted
	}
	title := ""
	if t.Title != nil {
		title = *t.Title
	}
	body := ""
	if t.Body != nil {
		body = *t.Body
	}
	taskResult := &TaskResult{
		ID:             t.ID,
		IDOrdering:     t.IDOrdering,
		Source:         taskSource,
		Deeplink:       t.Deeplink,
		Title:          title,
		Body:           body,
		TimeAllocation: timeAllocation,
		Sender:         t.Sender,
		SentAt:         t.CreatedAtExternal.Time().UTC().Format(time.RFC3339),
		DueDate:        dueDate,
		IsDone:         completed,
		Comments:       t.Comments,
	}

	if t.Status != nil && *t.Status != (database.ExternalTaskStatus{}) {
		taskResult.ExternalStatus = &externalStatus{
			State: t.Status.State,
			Type:  t.Status.Type,
		}
	}

	if t.SlackMessageParams != (database.SlackMessageParams{}) {
		taskResult.SlackMessageParams = &database.SlackMessageParams{
			Channel: t.SlackMessageParams.Channel,
			User:    t.SlackMessageParams.User,
			Team:    t.SlackMessageParams.Team,
			Message: t.SlackMessageParams.Message,
		}
	}

	return taskResult
}
