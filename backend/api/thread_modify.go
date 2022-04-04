package api

import (
	"context"
	"fmt"
	"log"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/chidiwilliams/flatbson"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type threadModifyParams struct {
	IsUnread *bool `json:"is_unread"`
	IsTask   *bool `json:"is_task"`
}

func (api *API) ThreadModify(c *gin.Context) {
	threadIDHex := c.Param("thread_id")
	threadID, err := primitive.ObjectIDFromHex(threadIDHex)
	if err != nil {
		// This means the thread ID is improperly formatted
		Handle404(c)
		return
	}
	var modifyParams threadModifyParams
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
	if modifyParams == (threadModifyParams{}) {
		c.JSON(400, gin.H{"detail": "parameter missing"})
		return
	}
	threadChangeableFields := threadModifyParamsToChangeable(&modifyParams)

	taskSourceResult, err := api.ExternalConfig.GetTaskSourceResult(thread.SourceID)
	if err != nil {
		log.Printf("failed to load external task source: %v", err)
		Handle500(c)
		return
	}

	// update external thread
	err = taskSourceResult.Source.ModifyThread(userID, thread.SourceAccountID, thread.ID, threadChangeableFields)
	if err != nil {
		log.Printf("failed to update external task source: %v", err)
		Handle500(c)
		return
	}

	err = updateThreadInDB(api, c.Request.Context(), threadID, userID, threadChangeableFields)
	if err != nil {
		log.Printf("could not update thread %v in DB with fields %+v", threadID, threadChangeableFields)
		Handle500(c)
		return
	}

	c.JSON(200, gin.H{})
}

func updateThreadInDB(api *API, ctx context.Context, threadID primitive.ObjectID, userID primitive.ObjectID, updateFields *database.ThreadItemChangeable) error {
	parentCtx := ctx
	if parentCtx == nil {
		parentCtx = context.Background()
	}
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return err
	}
	defer dbCleanup()
	taskCollection := database.GetTaskCollection(db)

	// We don't currently have this field in the DB, so unsetting to avoid confusion
	if updateFields.ThreadChangeable.IsUnread == nil {
		updateIsUnreadOnDBThreadEmails(threadID, userID, updateFields.ThreadChangeable.IsUnread)
	}
	updateFields.ThreadChangeable.IsUnread = nil

	// We flatten in order to do partial updates of nested documents correctly in mongodb
	flattenedUpdateFields, err := flatbson.Flatten(updateFields)
	if err != nil {
		log.Printf("Could not flatten %+v, error: %+v", updateFields, err)
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
		log.Printf("failed to update internal DB with fields: %+v and error %v", flattenedUpdateFields, err)
		return err
	}
	if res.MatchedCount != 1 {
		// Note, we don't consider res.ModifiedCount because no-op updates don't count as modified
		log.Printf("failed to find message %+v", res)
		return fmt.Errorf("failed to find message %+v", res)
	}

	return nil
}

func updateIsUnreadOnDBThreadEmails(threadID primitive.ObjectID, userID primitive.ObjectID, isUnread bool) error {
	var err error
	for _, email := range threadItem.EmailThread.Emails {
		err = changeLabelOnMessage(gmailService, email.EmailID, "UNREAD", addLabel)
		if err != nil {
			return err
		}
	}
	return nil
}

func threadModifyParamsToChangeable(modifyParams *threadModifyParams) *database.ThreadItemChangeable {
	return &database.ThreadItemChangeable{
		TaskTypeChangeable: &database.TaskTypeChangeable{IsTask: modifyParams.IsTask},
		ThreadChangeable:   database.ThreadChangeable{IsUnread: modifyParams.IsUnread},
	}
}
