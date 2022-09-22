package external

import (
	"context"
	"net/http"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/testutils"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func TestGetGithubToken(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()

	t.Run("NoDocument", func(t *testing.T) {
		_, err := GetGithubToken(database.GetExternalTokenCollection(db), userID, "accountID")
		assert.Equal(t, mongo.ErrNoDocuments, err)
	})
	t.Run("Success", func(t *testing.T) {
		database.GetExternalTokenCollection(db).InsertOne(context.Background(), database.ExternalAPIToken{
			UserID:    userID,
			ServiceID: TASK_SERVICE_ID_GITHUB,
			AccountID: "accountID",
			Token:     `{"access_token":"example"}`,
		})

		result, err := GetGithubToken(database.GetExternalTokenCollection(db), userID, "accountID")
		assert.NoError(t, err)
		assert.Equal(t, "example", result.AccessToken)
	})
}

func TestGithubHandleLinkCallback(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	userID := primitive.NewObjectID()

	t.Run("InvalidOauthToken", func(t *testing.T) {
		githubService := GithubService{
			Config: GithubConfig{
				OauthConfig: getGithubConfig(),
			},
		}

		server := testutils.GetMockAPIServer(t, http.StatusOK, "")
		githubService.Config.OauthConfig.AuthCodeURL(server.URL)
		oauth2Code := "invalid"
		err = githubService.HandleLinkCallback(db, CallbackParams{Oauth2Code: &oauth2Code}, userID)
		assert.Error(t, err)
	})
}
