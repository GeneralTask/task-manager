package api

import (
	"context"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type taskCreateParams struct {
	Title   string  `json:"title" binding:"required"`
	Body    string  `json:"body"`
	EmailID *string `json:"email_id"`
}

func (api *API) CreateTaskFromThread(c *gin.Context) {
	threadIDHex := c.Param("thread_id")
	threadID, err := primitive.ObjectIDFromHex(threadIDHex)
	if err != nil {
		// This means the thread ID is improperly formatted
		Handle404(c)
		return
	}
	var requestParams taskCreateParams
	err = c.BindJSON(&requestParams)
	if err != nil {
		log.Error().Err(err).Msg("could not parse request params")
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

	taskSourceResult, err := api.ExternalConfig.GetTaskSourceResult(thread.SourceID)
	if err != nil {
		log.Error().Err(err).Msg("failed to load external task source")
		Handle500(c)
		return
	}

	err = createTaskFromEmailThread(userID, thread, requestParams, taskSourceResult)
	if err != nil {
		log.Error().Err(err).Msgf("could not update thread %v in DB", threadID)
		Handle500(c)
		return
	}

	c.JSON(200, gin.H{})
}

func createTaskFromEmailThread(
	userID primitive.ObjectID,
	thread *database.Item,
	params taskCreateParams,
	taskSourceResult *external.TaskSourceResult,
) error {
	taskSection := constants.IDTaskSectionDefault
	accountID := external.GeneralTaskDefaultAccountID

	// TODO: we should inherit source ID  from the thread, but any sources besides GT will cause the task to be marked as done
	//  next time tasks/fetch is called, so we hardcode to GT for now
	newTask := database.Item{
		TaskBase: database.TaskBase{
			ID:              primitive.NewObjectID(),
			UserID:          userID,
			IDExternal:      primitive.NewObjectID().Hex(),
			IDTaskSection:   taskSection,
			SourceID:        external.TASK_SOURCE_ID_GT_TASK,
			Title:           params.Title,
			Body:            params.Body,
			SourceAccountID: accountID,
			Deeplink:        thread.Deeplink,
		},
		TaskType: database.TaskType{
			IsTask: true,
		},
	}

	taskDetails := database.Task{
		LinkedMessage: database.LinkedMessage{
			ThreadID: &thread.ID,
		},
	}
	if params.EmailID != nil {
		messageID, err := primitive.ObjectIDFromHex(*params.EmailID)
		if err != nil {
			// This means the message ID is improperly formatted
			log.Error().Err(err).Send()
			return err
		}
		taskDetails.LinkedMessage.EmailID = &messageID
	}
	newTask.Task = taskDetails

	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return err
	}
	defer dbCleanup()
	taskCollection := database.GetTaskCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	_, err = taskCollection.InsertOne(dbCtx, newTask)
	log.Debug().Str("threadID", thread.ID.String()).
		Str("newTaskID", newTask.ID.String()).
		Msg("Created new task from thread")
	return err

}
