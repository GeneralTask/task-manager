package api

import (
	"context"
	"log"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
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

func LinkedAccountsList(c *gin.Context) {
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
