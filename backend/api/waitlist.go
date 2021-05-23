package api

import (
	"context"
	"log"
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/utils"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type WaitlistParams struct {
	Email string `json:"email"`
}

func (api *API) WaitlistAdd(c *gin.Context) {
	var params WaitlistParams
	err := c.BindJSON(&params)
	if err != nil || params.Email == "" {
		log.Println("err:", err)
		c.JSON(400, gin.H{"detail": "Invalid or missing 'email' parameter."})
		return
	}
	if !utils.IsEmailValid(params.Email) {
		c.JSON(400, gin.H{"detail": "Invalid email format."})
		return
	}

	db, dbCleanup := database.GetDBConnection()
	defer dbCleanup()
	waitlistCollection := db.Collection("waitlist")
	_, err = waitlistCollection.UpdateOne(
		context.TODO(),
		bson.M{"email": params.Email},
		bson.M{"$setOnInsert": &database.WaitlistEntry{
			Email:     params.Email,
			CreatedAt: primitive.NewDateTimeFromTime(time.Now()),
		}},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		log.Fatalf("Failed to insert waitlist entry: %v", err)
	}
	c.JSON(200, gin.H{})
}
