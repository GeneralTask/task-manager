package api

import (
	"fmt"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestNoteDetail(t *testing.T) {
	authToken := login("test_notes_list@generaltask.com", "")

	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := getUserIDFromAuthToken(t, db, authToken)
	notUserID := primitive.NewObjectID()
	note1, err := database.GetOrCreateNote(
		db,
		userID,
		"123abc",
		"foobar_source",
		&database.Note{
			UserID:   userID,
			Title:    "title1",
			IsShared: true,
		},
	)
	assert.NoError(t, err)
	note2, err := database.GetOrCreateNote(
		db,
		userID,
		"123abcdef",
		"foobar_source",
		&database.Note{
			UserID:   userID,
			Title:    "title2",
			IsShared: false,
		},
	)
	assert.NoError(t, err)
	_, err = database.GetOrCreateNote(
		db,
		userID,
		"123abc",
		"foobar_source",
		&database.Note{
			UserID:   notUserID,
			IsShared: true,
		},
	)
	assert.NoError(t, err)
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	_ = note1
	_ = note2
	router := GetRouter(api)

	t.Run("InvalidNoteID", func(t *testing.T) {
		response := ServeRequest(t, authToken, "GET", fmt.Sprintf("/notes/details/%s/", primitive.NewObjectID().Hex()), nil, http.StatusNotFound, api)
		assert.Equal(t, "{\"detail\":\"not found\"}", string(response))
	})
	t.Run("NoteIsNotShared", func(t *testing.T) {
		request, _ := http.NewRequest(
			"GET",
			fmt.Sprintf("/notes/details/%s/", note1.ID.Hex()),
			nil)
		//request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"not found\"}", string(body))
		assert.Fail(t, "fsdaf")
	})
	//	t.Run("Success", func(t *testing.T) {
	//		request, _ := http.NewRequest(
	//			"GET",
	//			fmt.Sprintf("/tasks/detail/%s/", linearTaskIDHex),
	//			nil)
	//		request.Header.Add("Authorization", "Bearer "+authToken)
	//		recorder := httptest.NewRecorder()
	//		router.ServeHTTP(recorder, request)
	//		assert.Equal(t, http.StatusOK, recorder.Code)
	//		body, err := ioutil.ReadAll(recorder.Body)
	//		assert.NoError(t, err)
	//
	//		assert.Equal(t,
	//			fmt.Sprintf(`{"id":"%s","id_ordering":0,"source":{"name":"Linear","logo":"/images/linear.png","logo_v2":"linear","is_completable":true,"is_replyable":false},"deeplink":"","title":"","body":"","sender":"","due_date":"","priority_normalized":0,"time_allocated":0,"sent_at":"2019-04-20T00:00:00Z","is_done":true,"is_deleted":false,"is_meeting_preparation_task":false,"created_at":"2019-04-20T00:00:00Z","updated_at":"2019-04-29T00:00:00Z"}`, linearTaskIDHex),
	//			string(body))
	//	})
	//	t.Run("SuccessLinear", func(t *testing.T) {
	//		request, _ := http.NewRequest(
	//			"GET",
	//			fmt.Sprintf("/tasks/detail/%s/", linearTaskIDHex2),
	//			nil)
	//		request.Header.Add("Authorization", "Bearer "+authToken)
	//		recorder := httptest.NewRecorder()
	//		router.ServeHTTP(recorder, request)
	//		assert.Equal(t, http.StatusOK, recorder.Code)
	//		body, err := ioutil.ReadAll(recorder.Body)
	//		assert.NoError(t, err)
	//
	//		assert.Equal(t,
	//			fmt.Sprintf(`{"id":"%s","id_ordering":0,"source":{"name":"Linear","logo":"/images/linear.png","logo_v2":"linear","is_completable":true,"is_replyable":false},"deeplink":"","title":"","body":"","sender":"","due_date":"","priority_normalized":0,"time_allocated":0,"sent_at":"1970-01-01T00:00:00Z","is_done":true,"is_deleted":false,"is_meeting_preparation_task":false,"external_status":{"state":"Done","type":"completed"},"created_at":"1970-01-01T00:00:00Z","updated_at":"1970-01-01T00:00:00Z"}`, linearTaskIDHex2),
	//			string(body))
	//	})
}
