package api

import (
	"encoding/json"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"net/http"
	"testing"
)

func TestNotesList(t *testing.T) {
	authToken := login("test_notes_list@generaltask.com", "")
	true_val := true
	false_val := false
	title1 := "title1"
	title2 := "title2"
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := getUserIDFromAuthToken(t, db, authToken)
	notUserID := primitive.NewObjectID()
	task1, err := database.GetOrCreateNote(
		db,
		userID,
		"123abc",
		"foobar_source",
		&database.Note{
			UserID:   userID,
			Title:    &title1,
			IsShared: &true_val,
		},
	)
	assert.NoError(t, err)
	task2, err := database.GetOrCreateNote(
		db,
		userID,
		"123abcdef",
		"foobar_source",
		&database.Note{
			UserID:   userID,
			Title:    &title2,
			IsShared: &false_val,
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
			IsShared: &true_val,
		},
	)
	assert.NoError(t, err)

	UnauthorizedTest(t, "GET", "/notes/", nil)
	t.Run("Success", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()

		response := ServeRequest(t, authToken, "GET", "/notes/?", nil, http.StatusOK, api)
		var result []NoteResult
		err = json.Unmarshal(response, &result)

		assert.NoError(t, err)
		assert.Equal(t, 2, len(result))
		assert.Equal(t, []NoteResult{
			{
				ID:       task1.ID,
				Title:    "title1",
				IsShared: true,
			},
			{
				ID:    task2.ID,
				Title: "title2",
			},
		}, result)
	})
}