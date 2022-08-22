package api

import (
	"context"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (api *API) TasksFetch(c *gin.Context) {
	parentCtx := c.Request.Context()
	userID, _ := c.Get("user")
	var userObject database.User
	userCollection := database.GetUserCollection(api.DB)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err := userCollection.FindOne(dbCtx, bson.M{"_id": userID}).Decode(&userObject)

	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to find user")
		Handle500(c)
		return
	}

	currentTasks, err := database.GetActiveTasks(api.DB, userID.(primitive.ObjectID))
	if err != nil {
		Handle500(c)
		return
	}

	fetchedTasks, failedFetchSources, err := api.fetchTasks(parentCtx, api.DB, userID)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to fetch tasks")
		Handle500(c)
		return
	}
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	_, err = userCollection.UpdateOne(
		dbCtx,
		bson.M{"_id": userID},
		bson.M{"$set": bson.M{"last_refreshed": primitive.NewDateTimeFromTime(time.Now())}},
	)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to update user last_refreshed")
	}

	err = api.adjustForCompletedTasks(api.DB, currentTasks, fetchedTasks, failedFetchSources)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to adjust for completed tasks")
		Handle500(c)
		return
	}

	c.JSON(200, gin.H{})
}
