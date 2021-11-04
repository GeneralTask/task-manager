package external

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"log"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/oauth2"
)

type AsanaService struct {
	Config       OauthConfigWrapper
	ConfigValues AsanaConfigValues
}

type AsanaAuthToken struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	Scope        string `json:"scope"`
	ExpiresIn    int    `json:"expires_in"`
	TokenType    string `json:"token_type"`
}

type AsanaConfigValues struct {
	APIBaseURL      *string
	CloudIDURL      *string
	TokenURL        *string
	TransitionURL   *string
	PriorityListURL *string
}

type AsanaResponse struct {
	Data string `json:"data"`
}
type AsanaUserInfo struct {
	Email string `json:"email"`
	Name  string `json:"name"`
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

func (Asana AsanaService) GetLinkURL(stateTokenID primitive.ObjectID, userID primitive.ObjectID) (*string, error) {
	authURL := Asana.Config.AuthCodeURL(stateTokenID.Hex(), oauth2.AccessTypeOffline, oauth2.ApprovalForce)
	return &authURL, nil
}

func (Asana AsanaService) GetSignupURL(stateTokenID primitive.ObjectID, forcePrompt bool) (*string, error) {
	return nil, errors.New("asana does not support signup")
}

func (Asana AsanaService) HandleLinkCallback(params CallbackParams, userID primitive.ObjectID) error {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return errors.New("internal server error")
	}
	defer dbCleanup()

	extCtx, cancel := context.WithTimeout(parentCtx, constants.ExternalTimeout)
	defer cancel()
	token, err := Asana.Config.Exchange(extCtx, *params.Oauth2Code)
	if err != nil {
		log.Printf("failed to fetch token from Asana: %v", err)
		return errors.New("internal server error")
	}

	client := Asana.Config.Client(parentCtx, token)
	response, err := client.Get("https://app.asana.com/api/1.0/users/1200488949851905")
	if err != nil {
		log.Printf("failed to load user info: %v", err)
		return err
	}

	defer response.Body.Close()
	// var asanaResponse AsanaResponse
	userInfo := AsanaUserInfo{}

	err = json.NewDecoder(response.Body).Decode(&userInfo)
	fmt.Println("raw response", response)
	body, e := ioutil.ReadAll(response.Body)
	if e != nil {
		fmt.Println("err")
	}
	fmt.Println("reponse: ", body)
	fmt.Println("userInfo", userInfo)
	if err != nil {
		log.Printf("failed to load decode user info: %v", err)
		return err
	}

	tokenString, err := json.Marshal(&token)
	if err != nil {
		log.Printf("error parsing token: %v", err)
		return errors.New("internal server error")
	}

	externalAPITokenCollection := db.Collection("external_api_tokens")
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	_, err = externalAPITokenCollection.UpdateOne(
		dbCtx,
		bson.M{"$and": []bson.M{{"user_id": userID}, {"service_id": TASK_SERVICE_ID_ASANA}}},
		bson.M{"$set": &database.ExternalAPIToken{
			UserID:         userID,
			ServiceID:      TASK_SERVICE_ID_ASANA,
			Token:          string(tokenString),
			AccountID:      userInfo.Email,
			DisplayID:      userInfo.Name,
			IsUnlinkable:   true,
			IsPrimaryLogin: false,
		}},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		log.Printf("error saving token: %v", err)
		return errors.New("internal server error")
	}

	return nil
}

func (Asana AsanaService) HandleSignupCallback(params CallbackParams) (primitive.ObjectID, *string, error) {
	return primitive.NilObjectID, nil, errors.New("asana does not support signup")
}
