package api

import (
	"context"
	"strings"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/utils"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type WaitlistParams struct {
	Email string `json:"email"`
}

func (api *API) WaitlistAdd(c *gin.Context) {
	parentCtx := c.Request.Context()
	var params WaitlistParams
	err := c.BindJSON(&params)
	if err != nil || params.Email == "" {
		api.Logger.Error().Err(err).Msg("error")
		c.JSON(400, gin.H{"detail": "invalid or missing 'email' parameter."})
		return
	}
	if !utils.IsEmailValid(params.Email) {
		c.JSON(400, gin.H{"detail": "invalid email format."})
		return
	}
	email := strings.ToLower(params.Email)

	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()
	waitlistCollection := database.GetWaitlistCollection(db)

	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	count, err := waitlistCollection.CountDocuments(dbCtx, bson.M{"email": email})
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to query waitlist")
		Handle500(c)
		return
	}
	if count > 0 {
		c.JSON(302, gin.H{"detail": "email already exists in system"})
		return
	}

	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	_, err = waitlistCollection.InsertOne(
		dbCtx,
		&database.WaitlistEntry{
			Email:     email,
			CreatedAt: primitive.NewDateTimeFromTime(time.Now()),
		},
	)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to insert waitlist entry")
		Handle500(c)
		return
	}
	c.JSON(201, gin.H{})
}
