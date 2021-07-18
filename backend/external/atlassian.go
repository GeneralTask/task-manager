package external

import (
	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/database"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type AtlassianService struct{}

func (atlassian AtlassianService) GetLinkAuthURL(userID primitive.ObjectID) (*string, error) {
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return nil, err
	}
	defer dbCleanup()
	insertedStateToken, err := database.CreateStateToken(db, &userID)
	if err != nil {
		return nil, err
	}

	authURL := "https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=" + config.GetConfigValue("JIRA_OAUTH_CLIENT_ID") + "&scope=offline_access%20read%3Ajira-user%20read%3Ajira-work%20write%3Ajira-work&redirect_uri=" + config.GetConfigValue("SERVER_URL") + "authorize%2Fjira%2Fcallback%2F&state=" + *insertedStateToken + "&response_type=code&prompt=consent"
	return &authURL, nil
}

func (atlassian AtlassianService) HandleAuthCallback() error {
	return nil
}
