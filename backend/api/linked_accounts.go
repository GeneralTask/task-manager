package api

import (
	"context"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type SupportedAccountType struct {
	Name             string `json:"name"`
	Logo             string `json:"logo"`
	LogoV2           string `json:"logo_v2"`
	AuthorizationURL string `json:"authorization_url"`
}

type linkedAccount struct {
	ID           string `json:"id"`
	DisplayID    string `json:"display_id"`
	Name         string `json:"name"`
	Logo         string `json:"logo"`
	LogoV2       string `json:"logo_v2"`
	IsUnlinkable bool   `json:"is_unlinkable"`
	HasBadToken  bool   `json:"has_bad_token"`
}

func (api *API) SupportedAccountTypesList(c *gin.Context) {
	serverURL := config.GetConfigValue("SERVER_URL")
	nameToService := api.ExternalConfig.GetNameToService()
	supportedAccountTypes := []SupportedAccountType{}
	for serviceName, service := range nameToService {
		// need to check if Slack App (used in workflow installations)
		// we don't want this to appear in supported account typed list
		if !service.Details.IsLinkable || serviceName == external.TASK_SERVICE_ID_SLACK_APP {
			continue
		}
		supportedAccountTypes = append(supportedAccountTypes, SupportedAccountType{
			Name:             service.Details.Name,
			Logo:             service.Details.Logo,
			LogoV2:           service.Details.LogoV2,
			AuthorizationURL: serverURL + "link/" + service.Details.ID + "/",
		})
	}
	c.JSON(200, supportedAccountTypes)
}

func (api *API) LinkedAccountsList(c *gin.Context) {
	userID, _ := c.Get("user")
	externalAPITokenCollection := database.GetExternalTokenCollection(api.DB)

	var tokens []database.ExternalAPIToken
	cursor, err := externalAPITokenCollection.Find(
		context.Background(),
		bson.M{"user_id": userID},
	)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to fetch api tokens")
		Handle500(c)
		return
	}

	err = cursor.All(context.Background(), &tokens)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to iterate through api tokens")
		Handle500(c)
		return
	}
	linkedAccounts := []linkedAccount{}
	for _, token := range tokens {
		taskServiceResult, err := api.ExternalConfig.GetTaskServiceResult(token.ServiceID)
		if err != nil {
			api.Logger.Error().Err(err).Msg("failed to fetch task service")
			Handle500(c)
			return
		}
		linkedAccounts = append(linkedAccounts, linkedAccount{
			ID:           token.ID.Hex(),
			DisplayID:    token.DisplayID,
			Name:         taskServiceResult.Details.Name,
			Logo:         taskServiceResult.Details.Logo,
			LogoV2:       taskServiceResult.Details.LogoV2,
			IsUnlinkable: token.IsUnlinkable,
			HasBadToken:  token.IsBadToken,
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
	externalAPITokenCollection := database.GetExternalTokenCollection(api.DB)

	var accountToDelete database.ExternalAPIToken
	err = externalAPITokenCollection.FindOne(
		context.Background(),
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
	if accountToDelete.ServiceID == external.TASK_SERVICE_ID_GITHUB {
		_, err := database.GetRepositoryCollection(api.DB).DeleteMany(
			context.Background(),
			bson.M{"$and": []bson.M{
				{"$or": []bson.M{
					{"account_id": accountToDelete.AccountID},
					{"account_id": bson.M{"$exists": false}},
					{"account_id": ""},
				}},
				{"user_id": userID},
			}},
		)
		if err != nil {
			api.Logger.Error().Err(err).Msg("failed to clean up repositories")
			Handle500(c)
			return
		}
	}

	res, err := externalAPITokenCollection.DeleteOne(
		context.Background(),
		bson.M{"_id": accountID},
	)
	if err != nil || res.DeletedCount != 1 {
		api.Logger.Error().Err(err).Msg("error deleting linked account")
		Handle500(c)
		return
	}
	c.JSON(200, gin.H{})
}
