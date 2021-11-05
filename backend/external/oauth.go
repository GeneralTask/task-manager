package external

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/oauth2"
)

// HTTPClient ...
type HTTPClient interface {
	Get(url string) (*http.Response, error)
}

type OauthConfig struct {
	Config *oauth2.Config
}

func (c *OauthConfig) AuthCodeURL(state string, opts ...oauth2.AuthCodeOption) string {
	return c.Config.AuthCodeURL(state, opts...)
}

func (c *OauthConfig) Exchange(ctx context.Context, code string, opts ...oauth2.AuthCodeOption) (*oauth2.Token, error) {
	return c.Config.Exchange(ctx, code, opts...)
}

func (c *OauthConfig) Client(ctx context.Context, t *oauth2.Token) HTTPClient {
	return c.Config.Client(ctx, t)
}

// OauthConfigWrapper is the interface for interacting with the oauth2 config
type OauthConfigWrapper interface {
	AuthCodeURL(state string, opts ...oauth2.AuthCodeOption) string
	Client(ctx context.Context, t *oauth2.Token) HTTPClient
	Exchange(ctx context.Context, code string, opts ...oauth2.AuthCodeOption) (*oauth2.Token, error)
}

func getExternalOauth2Client(db *mongo.Database, userID primitive.ObjectID, accountID string, serviceID string, oauthConfig OauthConfigWrapper) *http.Client {
	parentCtx := context.Background()
	var externalToken database.ExternalAPIToken

	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	if err := database.GetExternalTokenCollection(db).FindOne(
		dbCtx,
		bson.M{"$and": []bson.M{
			{"user_id": userID},
			{"service_id": serviceID},
			{"account_id": accountID},
		}}).Decode(&externalToken); err != nil {
		return nil
	}

	var token oauth2.Token
	json.Unmarshal([]byte(externalToken.Token), &token)
	config := getGoogleLoginConfig()
	return config.Client(parentCtx, &token).(*http.Client)
}
