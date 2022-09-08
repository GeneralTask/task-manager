package external

import (
	"net/http"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/testutils"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestLinearLinkCallback(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	userID := primitive.NewObjectID()

	t.Run("InvalidOauthToken", func(t *testing.T) {
		config := GetConfig()
		linearService := LinearService{
			Config: config.Linear,
		}

		server := testutils.GetMockAPIServer(t, http.StatusOK, "")
		linearService.Config.OauthConfig.AuthCodeURL(server.URL)
		oauth2Code := "invalid"

		err = linearService.HandleLinkCallback(db, CallbackParams{Oauth2Code: &oauth2Code}, userID)
		assert.Error(t, err)
	})
}
