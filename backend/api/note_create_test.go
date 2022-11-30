package api

import (
	"bytes"
	"fmt"
	"github.com/GeneralTask/task-manager/backend/database"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCreateNote(t *testing.T) {
	authToken := login("approved@generaltask.com", "")
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()

	t.Run("MissingTitle", func(t *testing.T) {
		response := ServeRequest(t, authToken, "POST", "/notes/create/", nil, http.StatusBadRequest, api)
		assert.Equal(t, "{\"detail\":\"invalid or missing parameter\"}", string(response))
	})
	t.Run("SuccessTitleOnly", func(t *testing.T) {
		authToken = login("create_task_success_title_only@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, api.DB, authToken)

		body := ServeRequest(t, authToken, "POST", "/notes/create/", bytes.NewBuffer([]byte(`{"title": "buy more dogecoin"}`)), http.StatusOK, nil)

		notes, err := database.GetNotes(api.DB, userID)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(*notes))
		note := (*notes)[0]
		assert.Equal(t, "buy more dogecoin", *note.Title)
		assert.Equal(t, "", *note.Body)
		assert.Equal(t, fmt.Sprintf("{\"note_id\":\"%s\"}", note.ID.Hex()), string(body))
	})
}
