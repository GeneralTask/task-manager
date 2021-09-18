package api

import (
	"context"
	"log"
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
	parent_ctx := context.Background()
	var params WaitlistParams
	err := c.BindJSON(&params)
	if err != nil || params.Email == "" {
		log.Printf("error: %v", err)
		c.JSON(400, gin.H{"detail": "Invalid or missing 'email' parameter."})
		return
	}
	if !utils.IsEmailValid(params.Email) {
		c.JSON(400, gin.H{"detail": "Invalid email format."})
		return
	}
	email := strings.ToLower(params.Email)

	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()
	waitlistCollection := db.Collection("waitlist")

	db_ctx, cancel := context.WithTimeout(parent_ctx, constants.DatabaseTimeout)
	defer cancel()
	count, err := waitlistCollection.CountDocuments(db_ctx, bson.M{"email": email})
	if err != nil {
		log.Printf("failed to query waitlist: %v", err)
		Handle500(c)
		return
	}
	if count > 0 {
		c.JSON(302, gin.H{"detail": "Email already exists in system"})
		return
	}

	db_ctx, cancel = context.WithTimeout(parent_ctx, constants.DatabaseTimeout)
	defer cancel()
	_, err = waitlistCollection.InsertOne(
		db_ctx,
		&database.WaitlistEntry{
			Email:     email,
			CreatedAt: primitive.NewDateTimeFromTime(time.Now()),
		},
	)
	if err != nil {
		log.Printf("failed to insert waitlist entry: %v", err)
		Handle500(c)
		return
	}
	c.JSON(201, gin.H{})
}
