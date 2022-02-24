package api

import (
	"context"
	"log"

	"github.com/GeneralTask/task-manager/backend/constants"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (api *API) MessagesListV3(c *gin.Context) {
	parentCtx := c.Request.Context()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()

	var pagination database.Pagination
	err = c.Bind(&pagination)
	if err != nil {
		c.JSON(400, gin.H{"detail": "parameter missing or malformatted"})
		return
	}

	log.Printf("pag %+v", pagination)
	if pagination.Limit == nil {
		log.Println("Missing `limit` param")
		Handle500(c)
		return
	}
	if pagination.Page == nil {
		log.Println("Missing `page` param")
		Handle500(c)
		return
	}



	userID, _ := c.Get("user")
	var userObject database.User
	userCollection := database.GetUserCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = userCollection.FindOne(dbCtx, bson.M{"_id": userID}).Decode(&userObject)
	if err != nil {
		log.Printf("failed to find user: %v", err)
		Handle500(c)
		return
	}


	// emails, err := database.GetActiveEmails(db, userID.(primitive.ObjectID))
	emails, err := database.GetActiveEmailsPaged(db, userID.(primitive.ObjectID), pagination)
	if err != nil {
		Handle500(c)
		return
	}
	log.Printf("emails %+v", emails)

	// c.JSON(200, pagination)
	// return

	orderedMessages, err := api.orderMessagesV2(
		db,
		emails,
		userID.(primitive.ObjectID),
	)
	if err != nil {
		Handle500(c)
		return
	}
	c.JSON(200, orderedMessages)
}

type Pagination struct {
	Limit *int `form:"limit" json:"limit"`
	Page  *int `form:"page" json:"page"`
	// Sort  string `json:"sort"`
}
