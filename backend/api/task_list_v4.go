package api

import (
	"context"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type TaskSourceV4 struct {
	Name string `json:"name"`
	Logo string `json:"logo"`
}

type TaskResultV4 struct {
	ID                       primitive.ObjectID           `json:"id"`
	IDOrdering               int                          `json:"id_ordering"`
	IDFolder                 string                       `json:"id_folder"`
	IDParent                 string                       `json:"id_parent"`
	Source                   TaskSourceV4                 `json:"source"`
	Deeplink                 string                       `json:"deeplink"`
	Title                    string                       `json:"title"`
	Body                     string                       `json:"body"`
	DueDate                  string                       `json:"due_date"`
	PriorityNormalized       float64                      `json:"priority_normalized"`
	IsDone                   bool                         `json:"is_done"`
	IsDeleted                bool                         `json:"is_deleted"`
	RecurringTaskTemplateID  primitive.ObjectID           `json:"recurring_task_template_id,omitempty"`
	ExternalStatus           *externalStatus              `json:"external_status,omitempty"`
	AllStatuses              []*externalStatus            `json:"all_statuses,omitempty"`
	ExternalPriority         *externalPriority            `json:"priority,omitempty"`
	AllExternalPriorities    []*externalPriority          `json:"all_priorities,omitempty"`
	Comments                 *[]database.Comment          `json:"comments,omitempty"`
	SlackMessageParams       *database.SlackMessageParams `json:"slack_message_params,omitempty"`
	MeetingPreparationParams *MeetingPreparationParams    `json:"meeting_preparation_params,omitempty"`
	SubTaskIDs               []primitive.ObjectID         `json:"subtask_ids,omitempty"`
	NUXNumber                int                          `json:"id_nux_number,omitempty"`
	CreatedAt                string                       `json:"created_at,omitempty"`
	UpdatedAt                string                       `json:"updated_at,omitempty"`
}

func (api *API) TasksListV4(c *gin.Context) {
	userID := getUserIDFromContext(c)
	var userObject database.User
	userCollection := database.GetUserCollection(api.DB)
	err := userCollection.FindOne(context.Background(), bson.M{"_id": userID}).Decode(&userObject)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to find user")
		Handle500(c)
		return
	}

	activeTasks, err := database.GetActiveTasks(api.DB, userID)
	if err != nil {
		Handle500(c)
		return
	}
	completedTasks, err := database.GetCompletedTasks(api.DB, userID)
	if err != nil {
		Handle500(c)
		return
	}
	deletedTasks, err := database.GetDeletedTasks(api.DB, userID)
	if err != nil {
		Handle500(c)
		return
	}

	allTasks, err := api.mergeTasksV4(
		api.DB,
		activeTasks,
		completedTasks,
		deletedTasks,
		userID,
	)
	if err != nil {
		Handle500(c)
		return
	}
	c.JSON(200, allTasks)
}

func (api *API) mergeTasksV4(
	db *mongo.Database,
	activeTasks *[]database.Task,
	completedTasks *[]database.Task,
	deletedTasks *[]database.Task,
	userID primitive.ObjectID,
) ([]*TaskResultV4, error) {
	allTasks := []database.Task{}
	allTasks = append(allTasks, *activeTasks...)
	allTasks = append(allTasks, *completedTasks...)
	allTasks = append(allTasks, *deletedTasks...)
	return api.taskListToTaskResultListV4(&allTasks, userID), nil
}

// shares a lot of duplicate code with taskListToTaskResultList
// TODO: remove taskListToTaskResultList when frontend switches to new endpoint
func (api *API) taskListToTaskResultListV4(tasks *[]database.Task, userID primitive.ObjectID) []*TaskResultV4 {
	parentToChildIDs := make(map[primitive.ObjectID][]primitive.ObjectID)
	taskResults := []*TaskResultV4{}
	for _, task := range *tasks {
		if task.ParentTaskID != primitive.NilObjectID {
			value, exists := parentToChildIDs[task.ParentTaskID]
			if exists {
				parentToChildIDs[task.ParentTaskID] = append(value, task.ID)
			} else {
				parentToChildIDs[task.ParentTaskID] = []primitive.ObjectID{task.ID}
			}
		}
		// for implicit memory aliasing
		tempTask := task
		taskResults = append(taskResults, api.taskToTaskResultV4(&tempTask, userID))
	}

	// nodes with no valid parent will not appear in task results
	for _, node := range taskResults {
		value, exists := parentToChildIDs[node.ID]
		if exists {
			node.SubTaskIDs = value
		}
	}
	return taskResults
}

// shares a lot of duplicate code with taskBaseToTaskResult
// TODO: remove taskBaseToTaskResult when frontend switches to new endpoint
func (api *API) taskToTaskResultV4(t *database.Task, userID primitive.ObjectID) *TaskResultV4 {
	var dueDate string
	if t.DueDate != nil {
		if t.DueDate.Time().UTC().Year() <= 1971 {
			dueDate = ""
		} else {
			dueDate = t.DueDate.Time().UTC().Format(constants.YEAR_MONTH_DAY_FORMAT)
		}
	}

	taskSourceResult, err := api.ExternalConfig.GetSourceResult(t.SourceID)
	taskSource := TaskSourceV4{}
	if err == nil {
		taskSource = TaskSourceV4{
			Name: taskSourceResult.Details.Name,
			Logo: taskSourceResult.Details.LogoV2,
		}
	} else {
		api.Logger.Error().Err(err).Msgf("failed to find task source %s", t.SourceID)
	}

	// for null pointer checks
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
	taskResult := &TaskResultV4{
		ID:                 t.ID,
		IDOrdering:         t.IDOrdering,
		IDFolder:           t.IDTaskSection.Hex(),
		Source:             taskSource,
		Deeplink:           t.Deeplink,
		Title:              title,
		Body:               body,
		DueDate:            dueDate,
		PriorityNormalized: priority,
		IsDone:             completed,
		IsDeleted:          deleted,
		Comments:           t.Comments,
		NUXNumber:          t.NUXNumber,
		CreatedAt:          t.CreatedAtExternal.Time().UTC().Format(time.RFC3339),
		UpdatedAt:          t.UpdatedAt.Time().UTC().Format(time.RFC3339),
	}

	if t.ParentTaskID != primitive.NilObjectID {
		taskResult.IDParent = t.ParentTaskID.Hex()
		// we want to make folder ID blank if the task is a subtask
		taskResult.IDFolder = ""
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
				IDExternal:        status.ExternalID,
				State:             status.State,
				Type:              status.Type,
				Color:             status.Color,
				IsValidTransition: status.IsValidTransition,
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

	if t.RecurringTaskTemplateID != primitive.NilObjectID {
		taskResult.RecurringTaskTemplateID = t.RecurringTaskTemplateID
	}

	return taskResult
}
