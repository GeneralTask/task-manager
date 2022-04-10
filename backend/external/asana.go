package external

import (
	"context"
	"encoding/json"
	"errors"
	"github.com/rs/zerolog/log"
	"net/http"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/oauth2"
)

type AsanaService struct {
	Config       OauthConfigWrapper
	ConfigValues AsanaConfigValues
}

type AsanaConfigValues struct {
	UserInfoURL   *string
	TaskFetchURL  *string
	TaskUpdateURL *string
}

func getAsanaConfig() *OauthConfig {
	return &OauthConfig{Config: &oauth2.Config{
		ClientID:     config.GetConfigValue("ASANA_OAUTH_CLIENT_ID"),
		ClientSecret: config.GetConfigValue("ASANA_OAUTH_CLIENT_SECRET"),
		RedirectURL:  config.GetConfigValue("SERVER_URL") + "link/asana/callback/",
		Scopes:       []string{},
		Endpoint: oauth2.Endpoint{
			AuthURL:  "https://app.asana.com/-/oauth_authorize",
			TokenURL: "https://app.asana.com/-/oauth_token",
		},
	}}
}

func (asana AsanaService) GetLinkURL(stateTokenID primitive.ObjectID, userID primitive.ObjectID) (*string, error) {
	authURL := asana.Config.AuthCodeURL(stateTokenID.Hex(), oauth2.AccessTypeOffline, oauth2.ApprovalForce)
	return &authURL, nil
}

func (asana AsanaService) GetSignupURL(stateTokenID primitive.ObjectID, forcePrompt bool) (*string, error) {
	return nil, errors.New("asana does not support signup")
}

func (asana AsanaService) HandleLinkCallback(params CallbackParams, userID primitive.ObjectID) error {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return errors.New("internal server error")
	}
	defer dbCleanup()

	extCtx, cancel := context.WithTimeout(parentCtx, constants.ExternalTimeout)
	defer cancel()
	token, err := asana.Config.Exchange(extCtx, *params.Oauth2Code)
	if err != nil {
		log.Error().Msgf("failed to fetch token from Asana: %v", err)
		return errors.New("internal server error")
	}
	tokenExtra := token.Extra("data")
	if tokenExtra == nil {
		log.Error().Msg("missing 'data' from token response")
		return errors.New("internal server error")
	}
	accountEmail, ok := tokenExtra.(map[string]interface{})["email"]
	if !ok {
		log.Error().Msg("missing 'email' in 'data' from token response")
		return errors.New("internal server error")
	}

	tokenString, err := json.Marshal(&token)
	if err != nil {
		log.Error().Msgf("error parsing token: %v", err)
		return errors.New("internal server error")
	}

	externalAPITokenCollection := db.Collection("external_api_tokens")
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	accountID := accountEmail.(string)
	_, err = externalAPITokenCollection.UpdateOne(
		dbCtx,
		bson.M{"$and": []bson.M{{"user_id": userID}, {"service_id": TASK_SERVICE_ID_ASANA}, {"account_id": accountID}}},
		bson.M{"$set": &database.ExternalAPIToken{
			UserID:         userID,
			ServiceID:      TASK_SERVICE_ID_ASANA,
			Token:          string(tokenString),
			AccountID:      accountID,
			DisplayID:      accountID,
			IsUnlinkable:   true,
			IsPrimaryLogin: false,
		}},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		log.Error().Msgf("error saving token: %v", err)
		return errors.New("internal server error")
	}

	return nil
}

func (asana AsanaService) HandleSignupCallback(params CallbackParams) (primitive.ObjectID, *bool, *string, error) {
	return primitive.NilObjectID, nil, nil, errors.New("asana does not support signup")
}

func getAsanaHttpClient(db *mongo.Database, userID primitive.ObjectID, accountID string) *http.Client {
	return getExternalOauth2Client(db, userID, accountID, TASK_SERVICE_ID_ASANA, getAsanaConfig())
}
