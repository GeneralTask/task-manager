package api

import (
	"context"
	"errors"
	"time"

	"github.com/rs/zerolog/log"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TaskChangeable struct {
	PriorityID         *string                      `json:"priority_id,omitempty" bson:"priority_id,omitempty"`
	PriorityNormalized *float64                     `json:"priority_normalized,omitempty" bson:"priority_normalized,omitempty"`
	TaskNumber         *int                         `json:"task_number,omitempty" bson:"task_number,omitempty"`
	Comments           *[]database.Comment          `json:"comments,omitempty" bson:"comments,omitempty"`
	Status             *database.ExternalTaskStatus `json:"status,omitempty" bson:"status,omitempty"`
	// Used to cache the current status before marking the task as done
	PreviousStatus  *database.ExternalTaskStatus `json:"previous_status,omitempty" bson:"previous_status,omitempty"`
	CompletedStatus *database.ExternalTaskStatus `json:"completed_status,omitempty" bson:"completed_status,omitempty"`
}

type TaskItemChangeableFields struct {
	Task           TaskChangeable      `json:"task,omitempty" bson:"task,omitempty"`
	Title          *string             `json:"title,omitempty" bson:"title,omitempty"`
	Body           *string             `json:"body,omitempty" bson:"body,omitempty"`
	DueDate        *primitive.DateTime `json:"due_date,omitempty" bson:"due_date,omitempty"`
	TimeAllocation *int64              `json:"time_duration,omitempty" bson:"time_allocated,omitempty"`
	IsCompleted    *bool               `json:"is_completed,omitempty" bson:"is_completed,omitempty"`
	CompletedAt    primitive.DateTime  `json:"completed_at,omitempty" bson:"completed_at"`
}

type TaskModifyParams struct {
	IDOrdering    *int    `json:"id_ordering"`
	IDTaskSection *string `json:"id_task_section"`
	TaskItemChangeableFields
}

// dueDate must be of form 2006-03-02T15:04:05Z
func (api *API) TaskModify(c *gin.Context) {
	taskIDHex := c.Param("task_id")
	taskID, err := primitive.ObjectIDFromHex(taskIDHex)
	if err != nil {
		// This means the task ID is improperly formatted
		Handle404(c)
		return
	}
	var modifyParams TaskModifyParams
	err = c.BindJSON(&modifyParams)

	if err != nil {
		c.JSON(400, gin.H{"detail": "parameter missing or malformatted"})
		return
	}

	if modifyParams.IDTaskSection != nil {
		_, err := primitive.ObjectIDFromHex(*modifyParams.IDTaskSection)
		if err != nil {
			c.JSON(400, gin.H{"detail": "'id_task_section' is not a valid ID"})
			return
		}
	}

	userIDRaw, _ := c.Get("user")
	userID := userIDRaw.(primitive.ObjectID)

	task, err := database.GetTask(api.DB, c.Request.Context(), taskID, userID)
	if err != nil {
		c.JSON(404, gin.H{"detail": "task not found.", "taskId": taskID})
		return
	}

	// check if all fields are empty
	if modifyParams == (TaskModifyParams{}) {
		c.JSON(400, gin.H{"detail": "parameter missing"})
		return
	}

	taskSourceResult, err := api.ExternalConfig.GetSourceResult(task.SourceID)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to load external task source")
		Handle500(c)
		return
	}

	// check if all edit fields are empty
	if !ValidateFields(c, &modifyParams.TaskItemChangeableFields, taskSourceResult) {
		return
	}

	if modifyParams.TaskItemChangeableFields != (TaskItemChangeableFields{}) {
		updateTask := database.Task{
			Title:              modifyParams.TaskItemChangeableFields.Title,
			Body:               modifyParams.TaskItemChangeableFields.Body,
			DueDate:            modifyParams.TaskItemChangeableFields.DueDate,
			TimeAllocation:     modifyParams.TaskItemChangeableFields.TimeAllocation,
			IsCompleted:        modifyParams.TaskItemChangeableFields.IsCompleted,
			CompletedAt:        modifyParams.TaskItemChangeableFields.CompletedAt,
			PriorityID:         modifyParams.TaskItemChangeableFields.Task.PriorityID,
			PriorityNormalized: modifyParams.TaskItemChangeableFields.Task.PriorityNormalized,
			TaskNumber:         modifyParams.TaskItemChangeableFields.Task.TaskNumber,
			Comments:           modifyParams.TaskItemChangeableFields.Task.Comments,
			Status:             modifyParams.TaskItemChangeableFields.Task.Status,
			PreviousStatus:     modifyParams.TaskItemChangeableFields.Task.PreviousStatus,
			CompletedStatus:    modifyParams.TaskItemChangeableFields.Task.CompletedStatus,
		}

		err = taskSourceResult.Source.ModifyTask(api.DB, userID, task.SourceAccountID, task.IDExternal, &updateTask, task)
		if err != nil {
			api.Logger.Error().Err(err).Msg("failed to update external task source")
			Handle500(c)
			return
		}
		api.UpdateTaskInDB(c, task, userID, &updateTask)
	}

	// handle reorder task
	if modifyParams.IDOrdering != nil || modifyParams.IDTaskSection != nil {
		err = api.ReOrderTask(c, taskID, userID, modifyParams.IDOrdering, modifyParams.IDTaskSection, task)
		if err != nil {
			return
		}
	}

	c.JSON(200, gin.H{})
}

func ValidateFields(c *gin.Context, updateFields *TaskItemChangeableFields, taskSourceResult *external.TaskSourceResult) bool {
	if updateFields.IsCompleted != nil && *updateFields.IsCompleted && !taskSourceResult.Details.IsCompletable {
		c.JSON(400, gin.H{"detail": "cannot be marked done"})
		return false
	}
	if updateFields.IsCompleted != nil && *updateFields.IsCompleted {
		updateFields.CompletedAt = primitive.NewDateTimeFromTime(time.Now())
	}
	if updateFields.Title != nil && *updateFields.Title == "" {
		c.JSON(400, gin.H{"detail": "title cannot be empty"})
		return false
	}
	if updateFields.TimeAllocation != nil {
		if *updateFields.TimeAllocation < 0 {
			c.JSON(400, gin.H{"detail": "time duration cannot be negative"})
			return false
		} else {
			*updateFields.TimeAllocation *= constants.NANOSECONDS_IN_SECOND
		}
	}
	return true
}

func (api *API) ReOrderTask(c *gin.Context, taskID primitive.ObjectID, userID primitive.ObjectID, IDOrdering *int, IDTaskSectionHex *string, task *database.Task) error {
	parentCtx := c.Request.Context()
	taskCollection := database.GetTaskCollection(api.DB)
	updateFields := bson.M{"has_been_reordered": true}
	if IDOrdering != nil {
		updateFields["id_ordering"] = *IDOrdering
	}
	var IDTaskSection primitive.ObjectID
	if IDTaskSectionHex != nil {
		IDTaskSection, _ = primitive.ObjectIDFromHex(*IDTaskSectionHex)
		updateFields["id_task_section"] = IDTaskSection
	} else {
		IDTaskSection = task.IDTaskSection
	}
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	result, err := taskCollection.UpdateOne(
		dbCtx,
		bson.M{"$and": []bson.M{
			{"_id": taskID},
			{"user_id": userID},
		}},
		bson.M{"$set": updateFields},
	)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to update task in db")
		Handle500(c)
		return err
	}
	if result.MatchedCount != 1 {
		Handle404(c)
		return errors.New("task not found")
	}
	// Move back other tasks to ensure ordering is preserved (gaps are removed in GET task list)
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	_, err = taskCollection.UpdateMany(
		dbCtx,
		bson.M{"$and": []bson.M{
			{"_id": bson.M{"$ne": taskID}},
			{"id_ordering": bson.M{"$gte": IDOrdering}},
			{"id_task_section": IDTaskSection},
			{"user_id": userID},
		}},
		bson.M{"$inc": bson.M{"id_ordering": 1}},
	)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to move back other tasks in db")
		Handle500(c)
		return err
	}
	return nil
}

func GetTask(api *API, c *gin.Context, taskID primitive.ObjectID, userID primitive.ObjectID) (*database.Task, error) {
	parentCtx := c.Request.Context()
	taskCollection := database.GetTaskCollection(api.DB)

	var task database.Task
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err := taskCollection.FindOne(
		dbCtx,
		bson.M{"$and": []bson.M{
			{"_id": taskID},
			{"user_id": userID},
		}}).Decode(&task)
	if err != nil {
		c.JSON(404, gin.H{"detail": "task not found.", "taskId": taskID})
		return nil, err
	}
	return &task, nil
}

func (api *API) UpdateTaskInDB(c *gin.Context, task *database.Task, userID primitive.ObjectID, updateFields *database.Task) {
	parentCtx := c.Request.Context()
	taskCollection := database.GetTaskCollection(api.DB)

	if updateFields.IsCompleted != nil {
		updateFields.PreviousStatus = task.Status
		if *updateFields.IsCompleted {
			updateFields.Status = task.CompletedStatus
		} else {
			updateFields.Status = task.PreviousStatus
		}
	}

	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	res, err := taskCollection.UpdateOne(
		dbCtx,
		bson.M{"$and": []bson.M{
			{"_id": task.ID},
			{"user_id": userID},
		}},
		bson.M{"$set": updateFields},
	)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to update internal DB")
		Handle500(c)
		return
	}
	if res.MatchedCount != 1 {
		log.Print("failed to update task", res)
		Handle500(c)
		return
	}
}
