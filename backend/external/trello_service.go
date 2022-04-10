package external

import (
	"context"
	"encoding/json"
	"errors"
	"github.com/rs/zerolog/log"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/dghubble/oauth1"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type TrelloService struct {
	Config *oauth1.Config
}

func getTrelloConfig() *oauth1.Config {
	return &oauth1.Config{
		ConsumerKey:    config.GetConfigValue("TRELLO_OAUTH_CLIENT_ID"),
		ConsumerSecret: config.GetConfigValue("TRELLO_OAUTH_CLIENT_SECRET"),
		CallbackURL:    config.GetConfigValue("SERVER_URL") + "link/trello/callback/",
		Endpoint: oauth1.Endpoint{
			RequestTokenURL: "https://trello.com/1/OAuthGetRequestToken",
			AuthorizeURL:    "https://trello.com/1/OAuthAuthorizeToken",
			AccessTokenURL:  "https://trello.com/1/OAuthGetAccessToken",
		},
	}
}

func (trello TrelloService) GetLinkURL(stateTokenID primitive.ObjectID, userID primitive.ObjectID) (*string, error) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		log.Info().Msgf("failed to connect to db: %v", err)
		return nil, err
	}
	defer dbCleanup()

	requestToken, requestSecret, err := trello.Config.RequestToken()
	if err != nil {
		log.Info().Msgf("failed to get request token for link URL")
		return nil, err
	}
	secret := database.Oauth1RequestSecret{
		UserID:        userID,
		RequestSecret: requestSecret,
	}
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	authSecretCollection := database.GetOauth1RequestsSecretsCollection(db)
	_, err = authSecretCollection.DeleteMany(dbCtx, bson.M{"user_id": userID})
	if err != nil {
		log.Fatal().Msgf("failed to delete old request secrets: %v", err)
	}
	_, err = authSecretCollection.InsertOne(dbCtx, &secret)
	if err != nil {
		log.Info().Msgf("failed to create new request secret: %v", err)
		return nil, err
	}
	authURL, _ := trello.Config.AuthorizationURL(requestToken)
	authURLStr := authURL.String()
	return &authURLStr, nil
}

func (trello TrelloService) GetSignupURL(stateTokenID primitive.ObjectID, forcePrompt bool) (*string, error) {
	return nil, errors.New("trello does not support signup")
}

func (trello TrelloService) HandleLinkCallback(params CallbackParams, userID primitive.ObjectID) error {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return errors.New("internal server error")
	}
	defer dbCleanup()

	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	var secret database.Oauth1RequestSecret
	err = database.GetOauth1RequestsSecretsCollection(db).FindOne(dbCtx, bson.M{"user_id": userID}).Decode(&secret)
	if err != nil {
		log.Info().Msgf("failed to load request secret: %v", err)
	}

	accessToken, accessSecret, err := trello.Config.AccessToken(*params.Oauth1Token, secret.RequestSecret, *params.Oauth1Verifier)
	if err != nil {
		log.Info().Msgf("failed to fetch token from trello: %v", err)
		return errors.New("internal server error")
	}
	token := oauth1.NewToken(accessToken, accessSecret)

	tokenString, err := json.Marshal(&token)
	if err != nil {
		log.Info().Msgf("error parsing token: %v", err)
		return errors.New("internal server error")
	}

	externalAPITokenCollection := database.GetExternalTokenCollection(db)
	_, err = externalAPITokenCollection.UpdateOne(
		context.TODO(),
		bson.M{"$and": []bson.M{{"user_id": userID}, {"service_id": TASK_SERVICE_ID_TRELLO}, {"account_id": "todo"}}},
		bson.M{"$set": &database.ExternalAPIToken{
			UserID:         userID,
			ServiceID:      TASK_SERVICE_ID_TRELLO,
			Token:          string(tokenString),
			AccountID:      "todo",
			DisplayID:      "todo",
			IsUnlinkable:   true,
			IsPrimaryLogin: true,
		}},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		log.Info().Msgf("error saving token: %v", err)
		return errors.New("internal server error")
	}
	return nil
}

func (trello TrelloService) HandleSignupCallback(params CallbackParams) (primitive.ObjectID, *bool, *string, error) {
	return primitive.NilObjectID, nil, nil, errors.New("trello does not support signup")
}
