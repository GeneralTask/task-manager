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

type TaskModifyParams struct {
	IDOrdering    *int    `json:"id_ordering"`
	IDTaskSection *string `json:"id_task_section"`
	database.TaskItemChangeableFields
}

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

	task, err := database.GetItem(c.Request.Context(), taskID, userID)
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

	if modifyParams.TaskItemChangeableFields != (database.TaskItemChangeableFields{}) {
		// update external task
		err = taskSourceResult.Source.ModifyTask(userID, task.SourceAccountID, task.IDExternal, &modifyParams.TaskItemChangeableFields, task)
		if err != nil {
			api.Logger.Error().Err(err).Msg("failed to update external task source")
			Handle500(c)
			return
		}
		api.UpdateTaskInDB(c, task, userID, &modifyParams.TaskItemChangeableFields)
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

func ValidateFields(c *gin.Context, updateFields *database.TaskItemChangeableFields, taskSourceResult *external.TaskSourceResult) bool {
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

func (api *API) ReOrderTask(c *gin.Context, taskID primitive.ObjectID, userID primitive.ObjectID, IDOrdering *int, IDTaskSectionHex *string, task *database.Item) error {
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

func GetTask(api *API, c *gin.Context, taskID primitive.ObjectID, userID primitive.ObjectID) (*database.Item, error) {
	parentCtx := c.Request.Context()
	taskCollection := database.GetTaskCollection(api.DB)

	var task database.Item
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

func (api *API) UpdateTaskInDB(c *gin.Context, task *database.Item, userID primitive.ObjectID, updateFields *database.TaskItemChangeableFields) {
	parentCtx := c.Request.Context()
	taskCollection := database.GetTaskCollection(api.DB)

	if updateFields.IsCompleted != nil {
		updateFields.Task.PreviousStatus = &task.Status
		if *updateFields.IsCompleted {
			updateFields.Task.Status = &task.CompletedStatus
		} else {
			updateFields.Task.Status = &task.PreviousStatus
		}
	}

	flattenedTaskChangeableFields, err := database.FlattenStruct(updateFields)
	if err != nil {
		api.Logger.Error().Err(err).Msgf("failed to flatten struct %+v", updateFields)
		Handle500(c)
		return
	}

	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	res, err := taskCollection.UpdateOne(
		dbCtx,
		bson.M{"$and": []bson.M{
			{"_id": task.ID},
			{"user_id": userID},
		}},
		bson.M{"$set": flattenedTaskChangeableFields},
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
