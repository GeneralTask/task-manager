package api

import (
	"context"
	"log"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type SupportedAccountType struct {
	Name             string `json:"name"`
	Logo             string `json:"logo"`
	AuthorizationURL string `json:"authorization_url"`
}

type LinkedAccount struct {
	ID           string `json:"id"`
	DisplayID    string `json:"display_id"`
	Name         string `json:"name"`
	Logo         string `json:"logo"`
	IsUnlinkable bool   `json:"is_unlinkable"`
}

func (api *API) SupportedAccountTypesList(c *gin.Context) {
	serverURL := config.GetConfigValue("SERVER_URL")
	c.JSON(200, []SupportedAccountType{{
		Name:             "JIRA",
		Logo:             database.TaskSourceJIRA.Logo,
		AuthorizationURL: serverURL + "authorize/jira/",
	}})
}

func (api *API) LinkedAccountsList(c *gin.Context) {
	userID, _ := c.Get("user")
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()
	externalAPITokenCollection := db.Collection("external_api_tokens")

	var tokens []database.ExternalAPIToken
	cursor, err := externalAPITokenCollection.Find(
		context.TODO(),
		bson.M{"user_id": userID},
	)
	if err != nil {
		log.Printf("failed to fetch api tokens: %v", err)
		Handle500(c)
		return
	}
	err = cursor.All(context.TODO(), &tokens)
	if err != nil {
		log.Printf("failed to iterate through api tokens: %v", err)
		Handle500(c)
		return
	}
	linkedAccounts := []LinkedAccount{}
	for _, token := range tokens {
		linkedAccounts = append(linkedAccounts, LinkedAccount{
			ID:           token.ID.Hex(),
			DisplayID:    token.DisplayID,
			Name:         token.Source,
			Logo:         database.TaskSourceNameToSource[token.Source].Logo,
			IsUnlinkable: token.IsUnlinkable,
		})
	}
	c.JSON(200, linkedAccounts)
}

func (api *API) DeleteLinkedAccount(c *gin.Context) {
	userID, _ := c.Get("user")
	accountIDHex := c.Param("account_id")
	accountID, err := primitive.ObjectIDFromHex(accountIDHex)
	if err != nil {
		// This means the account ID is improperly formatted
		Handle404(c)
		return
	}
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()
	externalAPITokenCollection := db.Collection("external_api_tokens")
	var accountToDelete database.ExternalAPIToken
	err = externalAPITokenCollection.FindOne(
		context.TODO(),
		bson.M{"$and": []bson.M{
			{"user_id": userID},
			{"_id": accountID},
		}},
	).Decode(&accountToDelete)
	if err != nil {
		// document not found
		Handle404(c)
		return
	}
	if !accountToDelete.IsUnlinkable {
		c.JSON(400, gin.H{"detail": "account is not unlinkable"})
		return
	}
	res, err := externalAPITokenCollection.DeleteOne(
		context.TODO(),
		bson.M{"_id": accountID},
	)
	if err != nil || res.DeletedCount != 1 {
		log.Printf("error deleting linked account: %v", err)
		Handle500(c)
		return
	}
	c.JSON(200, gin.H{})
}
