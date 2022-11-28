package api

import (
	"context"
	"time"

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
	IDExternal string `json:"external_id,omitempty"`
	State      string `json:"state,omitempty"`
	Type       string `json:"type,omitempty"`
	Color      string `json:"color,omitempty"`
}

type externalPriority struct {
	IDExternal         string  `json:"external_id,omitempty"`
	Name               string  `json:"name,omitempty"`
	PriorityNormalized float64 `json:"priority_normalized,omitempty"`
	Color              string  `json:"color,omitempty"`
	IconURL            string  `json:"icon_url,omitempty"`
}

type MeetingPreparationParams struct {
	DatetimeStart string `json:"datetime_start"`
	DatetimeEnd   string `json:"datetime_end"`
}

type TaskResult struct {
	ID                       primitive.ObjectID           `json:"id"`
	IDOrdering               int                          `json:"id_ordering"`
	Source                   TaskSource                   `json:"source"`
	Deeplink                 string                       `json:"deeplink"`
	Title                    string                       `json:"title"`
	Body                     string                       `json:"body"`
	Sender                   string                       `json:"sender"`
	DueDate                  string                       `json:"due_date"`
	PriorityNormalized       float64                      `json:"priority_normalized"`
	TimeAllocation           int64                        `json:"time_allocated"`
	SentAt                   string                       `json:"sent_at"`
	IsDone                   bool                         `json:"is_done"`
	IsDeleted                bool                         `json:"is_deleted"`
	IsMeetingPreparationTask bool                         `json:"is_meeting_preparation_task"`
	ExternalStatus           *externalStatus              `json:"external_status,omitempty"`
	AllStatuses              []*externalStatus            `json:"all_statuses,omitempty"`
	ExternalPriority         *externalPriority            `json:"priority,omitempty"`
	AllExternalPriorities    []*externalPriority          `json:"all_priorities,omitempty"`
	Comments                 *[]database.Comment          `json:"comments,omitempty"`
	SlackMessageParams       *database.SlackMessageParams `json:"slack_message_params,omitempty"`
	MeetingPreparationParams *MeetingPreparationParams    `json:"meeting_preparation_params,omitempty"`
	SubTasks                 []*TaskResult                `json:"sub_tasks,omitempty"`
	NUXNumber                int                          `json:"nux_number_id,omitempty"`
	CreatedAt                string                       `json:"created_at,omitempty"`
	UpdatedAt                string                       `json:"updated_at,omitempty"`
}

type TaskSection struct {
	ID      primitive.ObjectID `json:"id"`
	Name    string             `json:"name"`
	Tasks   []*TaskResult      `json:"tasks"`
	IsDone  bool               `json:"is_done"`
	IsTrash bool               `json:"is_trash"`
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

func (api *API) fetchTasks(db *mongo.Database, userID interface{}) (*[]*database.Task, map[string]bool, error) {
	var tokens []database.ExternalAPIToken
	externalAPITokenCollection := database.GetExternalTokenCollection(db)
	cursor, err := externalAPITokenCollection.Find(
		context.Background(),
		bson.M{"user_id": userID},
	)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to fetch api tokens")
		return nil, nil, err
	}
	err = cursor.All(context.Background(), &tokens)
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
			//if token.ServiceID == external.TASK_SERVICE_ID_LINEAR && shouldPartialRefreshLinear(token) {
			if false {
				go api.getActiveLinearTasksFromDBForToken(token.UserID, token.AccountID, tasks)
			} else {
				go taskSourceResult.Source.GetTasks(api.DB, userID.(primitive.ObjectID), token.AccountID, tasks)
				// TODO update last full refresh after we fetch the tasks
				api.updateLastFullRefreshTime(token)
			}
			taskChannels = append(taskChannels, tasks)
		}
	}

	tasks := []*database.Task{}
	failedFetchSources := make(map[string]bool)
	for _, taskChannel := range taskChannels {
		taskResult := <-taskChannel
		if taskResult.Error != nil {
			isBadToken := external.CheckAndHandleBadToken(taskResult.Error, db, userID.(primitive.ObjectID), taskResult.AccountID, taskResult.SourceID)
			if !isBadToken {
				api.Logger.Error().Err(taskResult.Error).Msg("failed to load task source")
			}
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
		if !newTaskIDs[currentTask.ID] && !failedFetchSources[currentTask.SourceID] && !currentTask.IsMeetingPreparationTask {
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
	tasksCollection := database.GetTaskCollection(db)
	orderingID := 1
	for _, task := range *tasks {
		task.IDOrdering = orderingID
		orderingID += 1
		res, err := tasksCollection.UpdateOne(
			context.Background(),
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

		subtaskOrderingID := 1
		for _, subtask := range task.SubTasks {
			subtask.IDOrdering = subtaskOrderingID
			subtaskOrderingID += 1
			res, err := tasksCollection.UpdateOne(
				context.Background(),
				bson.M{"_id": subtask.ID},
				bson.M{"$set": bson.M{"id_ordering": subtask.IDOrdering}},
			)
			if err != nil {
				api.Logger.Error().Err(err).Msg("failed to update subtask ordering ID")
				return err
			}
			if res.MatchedCount != 1 {
				api.Logger.Error().Interface("taskResult", subtask).Msgf("did not find subtask to update ordering ID (ID=%v)", subtask.ID)
			}
		}
	}
	return nil
}

func (api *API) taskListToTaskResultList(tasks *[]database.Task, userID primitive.ObjectID) []*TaskResult {
	parentToChild := make(map[primitive.ObjectID][]*TaskResult)
	baseNodes := []*TaskResult{}
	for _, task := range *tasks {
		result := api.taskBaseToTaskResult(&task, userID)
		if task.ParentTaskID != primitive.NilObjectID {
			value, exists := parentToChild[task.ParentTaskID]
			if exists {
				parentToChild[task.ParentTaskID] = append(value, result)
			} else {
				parentToChild[task.ParentTaskID] = []*TaskResult{result}
			}
		} else {
			baseNodes = append(baseNodes, result)
		}
	}

	// nodes with no valid parent will not appear in task results
	taskResults := []*TaskResult{}
	for _, node := range baseNodes {
		value, exists := parentToChild[node.ID]
		if exists {
			node.SubTasks = value
		}
		taskResults = append(taskResults, node)
	}
	return taskResults
}

func (api *API) taskBaseToTaskResult(t *database.Task, userID primitive.ObjectID) *TaskResult {
	var dueDate string
	if t.DueDate != nil {
		if t.DueDate.Time().Unix() == int64(0) {
			dueDate = ""
		} else {
			dueDate = t.DueDate.Time().UTC().Format("2006-01-02")
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
	deleted := false
	if t.IsDeleted != nil {
		deleted = *t.IsDeleted
	}
	title := ""
	if t.Title != nil {
		title = *t.Title
	}
	body := ""
	if t.Body != nil {
		body = *t.Body
	}
	priority := 0.0
	if t.PriorityNormalized != nil {
		priority = *t.PriorityNormalized
	}
	taskResult := &TaskResult{
		ID:                       t.ID,
		IDOrdering:               t.IDOrdering,
		Source:                   taskSource,
		Deeplink:                 t.Deeplink,
		Title:                    title,
		Body:                     body,
		TimeAllocation:           timeAllocation,
		Sender:                   t.Sender,
		SentAt:                   t.CreatedAtExternal.Time().UTC().Format(time.RFC3339),
		DueDate:                  dueDate,
		PriorityNormalized:       priority,
		IsDone:                   completed,
		IsDeleted:                deleted,
		Comments:                 t.Comments,
		IsMeetingPreparationTask: t.IsMeetingPreparationTask,
		NUXNumber:                t.NUXNumber,
		CreatedAt:                t.CreatedAtExternal.Time().UTC().Format(time.RFC3339),
		UpdatedAt:                t.UpdatedAt.Time().UTC().Format(time.RFC3339),
	}

	if t.Status != nil && *t.Status != (database.ExternalTaskStatus{}) {
		taskResult.ExternalStatus = &externalStatus{
			IDExternal: t.Status.ExternalID,
			State:      t.Status.State,
			Type:       t.Status.Type,
		}
	}
	if t.AllStatuses != nil {
		allStatuses := []*externalStatus{}
		for _, status := range t.AllStatuses {
			allStatuses = append(allStatuses, &externalStatus{
				IDExternal: status.ExternalID,
				State:      status.State,
				Type:       status.Type,
				Color:      status.Color,
			})
		}
		taskResult.AllStatuses = allStatuses
	}

	if t.SlackMessageParams != nil && *t.SlackMessageParams != (database.SlackMessageParams{}) {
		taskResult.SlackMessageParams = &database.SlackMessageParams{
			Channel: t.SlackMessageParams.Channel,
			User:    t.SlackMessageParams.User,
			Team:    t.SlackMessageParams.Team,
			Message: t.SlackMessageParams.Message,
		}
	}

	if t.MeetingPreparationParams != nil && *t.MeetingPreparationParams != (database.MeetingPreparationParams{}) && t.IsMeetingPreparationTask {
		taskResult.MeetingPreparationParams = &MeetingPreparationParams{
			DatetimeStart: t.MeetingPreparationParams.DatetimeStart.Time().UTC().Format(time.RFC3339),
			DatetimeEnd:   t.MeetingPreparationParams.DatetimeEnd.Time().UTC().Format(time.RFC3339),
		}
	}

	if t.ExternalPriority != nil && *t.ExternalPriority != (database.ExternalTaskPriority{}) {
		taskResult.ExternalPriority = &externalPriority{
			IDExternal:         t.ExternalPriority.ExternalID,
			Name:               t.ExternalPriority.Name,
			PriorityNormalized: t.ExternalPriority.PriorityNormalized,
			Color:              t.ExternalPriority.Color,
			IconURL:            t.ExternalPriority.IconURL,
		}
	}

	if len(t.AllExternalPriorities) > 0 {
		allPriorities := []*externalPriority{}
		for _, priority := range t.AllExternalPriorities {
			allPriorities = append(allPriorities, &externalPriority{
				IDExternal:         priority.ExternalID,
				Name:               priority.Name,
				PriorityNormalized: priority.PriorityNormalized,
				Color:              priority.Color,
				IconURL:            priority.IconURL,
			})
		}
		taskResult.AllExternalPriorities = allPriorities
	}

	return taskResult
}

func (api *API) getSubtaskResults(task *database.Task, userID primitive.ObjectID) []*TaskResult {
	subtasks, err := database.GetTasks(api.DB, userID, &[]bson.M{{"parent_task_id": task.ID}}, nil)
	if err == nil && len(*subtasks) > 0 {
		subtaskResults := []*TaskResult{}
		for _, subtask := range *subtasks {
			subtaskResults = append(subtaskResults, api.taskBaseToTaskResult(&subtask, userID))
		}
		return subtaskResults
	} else {
		return nil
	}
}

func (api *API) getActiveLinearTasksFromDBForToken(userID primitive.ObjectID, accountID string, result chan<- external.TaskResult) {
	taskCollection := database.GetTaskCollection(api.DB)
	additionalFilters := []bson.M{
		{"source_account_id": accountID},
		{"source_id": external.TASK_SOURCE_ID_LINEAR},
		{"is_completed": false},
		{"is_deleted": bson.M{"$ne": true}},
	}
	var tasks []database.Task
	err := database.FindWithCollection(taskCollection, userID, &additionalFilters, &tasks, nil)
	if err != nil {
		result <- external.TaskResult{Error: err}
		return
	}

	var taskResults []*database.Task
	for _, task := range tasks {
		taskCopy := task
		taskResults = append(taskResults, &taskCopy)
	}

	result <- external.TaskResult{
		Tasks:     taskResults,
		ServiceID: external.TASK_SERVICE_ID_LINEAR,
		AccountID: accountID,
	}
}

func (api *API) updateLastFullRefreshTime(token database.ExternalAPIToken) error {
	externalAPITokenCollection := database.GetExternalTokenCollection(api.DB)
	refreshTime := time.Now()
	_, err := externalAPITokenCollection.UpdateOne(
		context.Background(),
		bson.M{"$and": []bson.M{{"user_id": token.UserID}, {"service_id": token.ServiceID}}},
		bson.M{"$set": bson.M{"last_full_refresh_time": primitive.NewDateTimeFromTime(refreshTime)}},
		nil,
	)
	return err
}

func shouldPartialRefreshLinear(token database.ExternalAPIToken) bool {
	return time.Now().Sub(token.LastFullRefreshTime.Time()) < (15 * time.Minute)
}
