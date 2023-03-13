package api

import (
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/testutils"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestNoteDetail(t *testing.T) {
	authToken := login("test_notes_detail@generaltask.com", "")
	title1 := "title1"
	title2 := "title2"

	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := getUserIDFromAuthToken(t, db, authToken)
	startTime, _ := time.Parse(time.RFC3339, "2021-03-06T15:00:00-05:00")
	endTime, _ := time.Parse(time.RFC3339, "2021-03-06T15:30:00-05:00")
	event, err := database.GetOrCreateCalendarEvent(
		db,
		userID,
		"123abc",
		"foobar_source",
		&database.CalendarEvent{
			IDExternal:    "123abc",
			SourceID:      "foobar_source",
			UserID:        userID,
			DatetimeStart: primitive.NewDateTimeFromTime(startTime),
			DatetimeEnd:   primitive.NewDateTimeFromTime(endTime),
		},
	)
	assert.NoError(t, err)
	note1, err := database.GetOrCreateNote(
		db,
		userID,
		"123abc",
		"foobar_source",
		&database.Note{
			UserID:        userID,
			Title:         &title1,
			SharedUntil:   *testutils.CreateDateTime("9999-01-01"),
			LinkedEventID: event.ID,
		},
	)
	assert.NoError(t, err)
	note2, err := database.GetOrCreateNote(
		db,
		userID,
		"123abcdef",
		"foobar_source",
		&database.Note{
			UserID:      userID,
			Title:       &title2,
			SharedUntil: *testutils.CreateDateTime("1999-01-01"),
		},
	)
	assert.NoError(t, err)
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	_ = note1
	_ = note2
	router := GetRouter(api)

	t.Run("InvalidNoteID", func(t *testing.T) {
		request, _ := http.NewRequest(
			"GET",
			fmt.Sprintf("/notes/detail/%s/", primitive.NewObjectID()),
			nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
		response, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"not found\"}", string(response))
	})
	t.Run("NoteIsNotShared", func(t *testing.T) {
		request, _ := http.NewRequest(
			"GET",
			fmt.Sprintf("/notes/detail/%s/", note2.ID.Hex()),
			nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"not found\"}", string(body))
	})
	t.Run("Success", func(t *testing.T) {
		request, _ := http.NewRequest(
			"GET",
			fmt.Sprintf("/notes/detail/%s/", note1.ID.Hex()),
			nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)

		assert.Equal(t,
			fmt.Sprintf(`{"id":"%s","title":"title1","shared_until":"9999-01-01T00:00:00Z","linked_event_id":"%s","linked_event_start":"2021-03-06T20:00:00Z","linked_event_end":"2021-03-06T20:30:00Z"}`, note1.ID.Hex(), event.ID.Hex()),
			string(body))
	})
}
