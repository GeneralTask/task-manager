package api

import (
	"context"
	"github.com/rs/zerolog/log"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

type UserInfo struct {
	AgreedToTerms      bool `json:"agreed_to_terms"`
	OptedIntoMarketing bool `json:"opted_into_marketing"`
}

type UserInfoParams struct {
	AgreedToTerms      *bool `json:"agreed_to_terms" bson:"agreed_to_terms,omitempty"`
	OptedIntoMarketing *bool `json:"opted_into_marketing" bson:"opted_into_marketing,omitempty"`
}

func (api *API) UserInfoGet(c *gin.Context) {
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
		log.Error().Err(err).Msg("failed to find user")
		Handle500(c)
		return
	}
	c.JSON(200, UserInfo{
		AgreedToTerms:      userObject.AgreedToTerms != nil && *userObject.AgreedToTerms,
		OptedIntoMarketing: userObject.OptedIntoMarketing != nil && *userObject.OptedIntoMarketing,
	})
}

func (api *API) UserInfoUpdate(c *gin.Context) {
	parentCtx := c.Request.Context()
	var params UserInfoParams
	err := c.BindJSON(&params)
	if err != nil {
		log.Error().Err(err).Msg("error")
		c.JSON(400, gin.H{"detail": "invalid or missing parameters."})
		return
	}

	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()

	userID, _ := c.Get("user")
	userCollection := database.GetUserCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	_, err = userCollection.UpdateOne(
		dbCtx,
		bson.M{"_id": userID},
		bson.M{"$set": params},
	)
	if err != nil {
		Handle500(c)
		return
	}
	c.JSON(200, gin.H{})
}
