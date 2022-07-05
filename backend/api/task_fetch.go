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
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}

	defer dbCleanup()
	userID, _ := c.Get("user")
	var userObject database.User
	userCollection := database.GetUserCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = userCollection.FindOne(dbCtx, bson.M{"_id": userID}).Decode(&userObject)

	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to find user")
		Handle500(c)
		return
	}

	currentTasks, err := database.GetActiveTasks(db, userID.(primitive.ObjectID))
	if err != nil {
		Handle500(c)
		return
	}

	fetchedTasks, failedFetchSources, err := api.fetchTasks(parentCtx, db, userID)
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

	err = api.adjustForCompletedTasks(db, currentTasks, fetchedTasks, failedFetchSources)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to adjust for completed tasks")
		Handle500(c)
		return
	}

	c.JSON(200, gin.H{})
}
