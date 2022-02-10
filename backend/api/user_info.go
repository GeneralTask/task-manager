package api

import (
	"context"
	"log"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

type UserInfo struct {
	AgreedToTerms         bool `json:"agreed_to_terms"`
	OptedIntoMarketing    bool `json:"opted_into_marketing"`
	OptedOutOfArbitration bool `json:"opted_out_of_arbitration"`
}

func (api *API) UserInfo(c *gin.Context) {
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
		log.Printf("failed to find user: %v", err)
		Handle500(c)
		return
	}
	c.JSON(200, UserInfo{
		AgreedToTerms:         userObject.AgreedToTerms,
		OptedIntoMarketing:    userObject.OptedIntoMarketing,
		OptedOutOfArbitration: userObject.OptedOutOfArbitration,
	})
}
