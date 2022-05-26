package external

import (
	"net/http"
	"testing"

	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/GeneralTask/task-manager/backend/testutils"

	"github.com/stretchr/testify/assert"
)

func TestLoadSlackTasks(t *testing.T) {
	// parentCtx := context.Background()
	// db, dbCleanup, err := database.GetDBConnection()
	// assert.NoError(t, err)
	// defer dbCleanup()

	t.Run("BadSlackStatusCode", func(t *testing.T) {
		savedMessagesServer := testutils.GetMockAPIServer(t, http.StatusInternalServerError, "")
		defer savedMessagesServer.Close()
		savedMessagesURL := savedMessagesServer.URL + "/"
		slackSaved := SlackSavedTaskSource{Slack: SlackService{Config: SlackConfig{ConfigValues: SlackConfigValues{SavedMessagesURL: &savedMessagesURL}}}}
		userID := primitive.NewObjectID()

		var taskResult = make(chan TaskResult)
		go slackSaved.GetTasks(userID, "hood_stock@down_bad.com", taskResult)
		result := <-taskResult
		assert.NotEqual(t, nil, result.Error)
		assert.Equal(t, "slack server error: 500 Internal Server Error", result.Error.Error())
		assert.Equal(t, 0, len(result.Tasks))
	})
	t.Run("BadSlackResponse", func(t *testing.T) {})
	t.Run("Success", func(t *testing.T) {})
	t.Run("SuccessExisting", func(t *testing.T) {})
}
