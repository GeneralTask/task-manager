package external

import (
	"net/http"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/testutils"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestSlackLinkCallback(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	userID := primitive.NewObjectID()

	t.Run("InvalidOauthToken", func(t *testing.T) {
		slackService := SlackService{
			Config: getSlackConfig(),
		}

		server := testutils.GetMockAPIServer(t, http.StatusOK, "")
		slackService.Config.OauthConfig.AuthCodeURL(server.URL)
		oauth2Code := "invalid"
		err = slackService.HandleLinkCallback(db, CallbackParams{Oauth2Code: &oauth2Code}, userID)
		assert.Error(t, err)
	})
}
