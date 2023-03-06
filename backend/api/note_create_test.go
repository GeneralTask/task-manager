package api

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestCreateNote(t *testing.T) {
	authToken := login("approved@generaltask.com", "")
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()

	UnauthorizedTest(t, "POST", "/notes/create/", bytes.NewBuffer([]byte(`{"title": "duck@duck.com"}`)))
	t.Run("MissingTitle", func(t *testing.T) {
		response := ServeRequest(t, authToken, "POST", "/notes/create/", nil, http.StatusBadRequest, api)
		assert.Equal(t, "{\"detail\":\"invalid or missing parameter\"}", string(response))
	})
	t.Run("NoLinkedEvent", func(t *testing.T) {
		authToken = login("create_task_no_linked@generaltask.com", "")

		defaultNoteCreateObject := NoteCreateParams{
			Title:         "buy more dogecoin",
			LinkedEventID: primitive.NewObjectID(),
		}
		bodyParams, err := json.Marshal(defaultNoteCreateObject)
		assert.NoError(t, err)

		_ = ServeRequest(t, authToken, "POST", "/notes/create/", bytes.NewBuffer(bodyParams), http.StatusBadRequest, nil)
	})
	t.Run("SuccessTitleOnly", func(t *testing.T) {
		authToken = login("create_task_success_title_only@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, api.DB, authToken)

		body := ServeRequest(t, authToken, "POST", "/notes/create/", bytes.NewBuffer([]byte(`{"title": "buy more dogecoin", "body": "test body", "author": "test author", "is_shared": true}`)), http.StatusOK, nil)

		notes, err := database.GetNotes(api.DB, userID)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(*notes))
		note := (*notes)[0]
		assert.Equal(t, "buy more dogecoin", *note.Title)
		assert.Equal(t, "test body", *note.Body)
		assert.Equal(t, "test author", note.Author)
		assert.Equal(t, primitive.DateTime(0), note.SharedUntil)
		assert.Equal(t, fmt.Sprintf("{\"note_id\":\"%s\"}", note.ID.Hex()), string(body))
	})
	t.Run("SuccessWithLinkedEvent", func(t *testing.T) {
		authToken = login("create_task_success_with_linked@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, api.DB, authToken)

		eventCollection := database.GetCalendarEventCollection(api.DB)
		insertResult, err := eventCollection.InsertOne(context.Background(), database.CalendarEvent{
			UserID:          userID,
			SourceAccountID: "account_id_2",
			CalendarID:      "cal_2",
			IDExternal:      "sample_calendar_id_2",
			SourceID:        external.TASK_SOURCE_ID_GCAL,
		})
		assert.NoError(t, err)
		calendarTaskID := insertResult.InsertedID.(primitive.ObjectID)

		defaultNoteCreateObject := NoteCreateParams{
			Title:         "buy more dogecoin",
			LinkedEventID: calendarTaskID,
		}
		bodyParams, err := json.Marshal(defaultNoteCreateObject)
		assert.NoError(t, err)

		body := ServeRequest(t, authToken, "POST", "/notes/create/", bytes.NewBuffer(bodyParams), http.StatusOK, nil)

		notes, err := database.GetNotes(api.DB, userID)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(*notes))
		note := (*notes)[0]
		assert.Equal(t, "buy more dogecoin", *note.Title)
		assert.Equal(t, calendarTaskID, note.LinkedEventID)
		assert.Equal(t, primitive.DateTime(0), note.SharedUntil)
		assert.Equal(t, fmt.Sprintf("{\"note_id\":\"%s\"}", note.ID.Hex()), string(body))
	})
}
