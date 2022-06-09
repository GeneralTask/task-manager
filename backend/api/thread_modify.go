package api

import (
	"context"
	"fmt"

	"github.com/rs/zerolog/log"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/chidiwilliams/flatbson"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ThreadModifyParams struct {
	IsUnread   *bool `json:"is_unread"`
	IsArchived *bool `json:"is_archived"`
}

func (api *API) ThreadModify(c *gin.Context) {
	threadIDHex := c.Param("thread_id")
	threadID, err := primitive.ObjectIDFromHex(threadIDHex)
	if err != nil {
		// This means the thread ID is improperly formatted
		Handle404(c)
		return
	}
	var modifyParams ThreadModifyParams
	err = c.BindJSON(&modifyParams)
	if err != nil {
		c.JSON(400, gin.H{"detail": "parameter missing or malformatted"})
		return
	}

	userIDRaw, _ := c.Get("user")
	userID := userIDRaw.(primitive.ObjectID)

	thread, err := database.GetItem(c.Request.Context(), threadID, userID)
	if err != nil {
		Handle404(c)
		return
	}

	// check if all fields are empty
	if modifyParams == (ThreadModifyParams{}) {
		c.JSON(400, gin.H{"detail": "parameter missing"})
		return
	}

	taskSourceResult, err := api.ExternalConfig.GetTaskSourceResult(thread.SourceID)
	if err != nil {
		log.Error().Err(err).Msg("failed to load external task source")
		Handle500(c)
		return
	}

	// update external thread
	err = taskSourceResult.Source.ModifyThread(userID, thread.SourceAccountID, thread.ID, modifyParams.IsUnread, modifyParams.IsArchived)
	if err != nil {
		log.Error().Err(err).Msg("failed to update external task source")
		Handle500(c)
		return
	}

	err = updateThreadInDB(api, c.Request.Context(), threadID, userID, &modifyParams)
	if err != nil {
		log.Error().Err(err).Msgf("could not update thread %v in DB", threadID)
		Handle500(c)
		return
	}

	c.JSON(200, gin.H{})
}

func updateThreadInDB(api *API, ctx context.Context, threadID primitive.ObjectID, userID primitive.ObjectID, params *ThreadModifyParams) error {
	parentCtx := ctx
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return err
	}
	defer dbCleanup()
	taskCollection := database.GetTaskCollection(db)

	thread, err := database.GetItem(ctx, threadID, userID)
	if err != nil {
		return fmt.Errorf("thread not found, threadID: %s", threadID)
	}
	threadChangeable := database.ThreadItemToChangeable(thread)

	if params.IsUnread != nil {
		for i := range threadChangeable.EmailThreadChangeable.Emails {
			threadChangeable.EmailThreadChangeable.Emails[i].IsUnread = *params.IsUnread
		}
	}

	if params.IsArchived != nil {
		threadChangeable.EmailThreadChangeable.IsArchived = params.IsArchived
	}

	// We flatten in order to do partial updates of nested documents correctly in mongodb
	flattenedUpdateFields, err := flatbson.Flatten(threadChangeable)
	if err != nil {
		log.Error().Err(err).Msgf("Could not flatten %+v", flattenedUpdateFields)
		return err
	}
	if len(flattenedUpdateFields) == 0 {
		// If there are no fields to update in the DB
		return nil
	}
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	res, err := taskCollection.UpdateOne(
		dbCtx,
		bson.M{"$and": []bson.M{
			{"_id": threadID},
			{"user_id": userID},
		}},
		bson.M{"$set": flattenedUpdateFields},
	)
	if err != nil {
		log.Error().Err(err).Msgf("failed to update internal DB with fields: %+v", flattenedUpdateFields)
		return err
	}
	if res.MatchedCount != 1 {
		// Note, we don't consider res.ModifiedCount because no-op updates don't count as modified
		log.Error().Msgf("failed to find message %+v", res)
		return fmt.Errorf("failed to find message %+v", res)
	}

	return nil
}
