package api

import (
	"encoding/json"
	"net/http"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/testutils"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestNotesList(t *testing.T) {
	authToken := login("test_notes_list@generaltask.com", "")
	title1 := "title1"
	title2 := "title2"
	title3 := "deleted note"
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
			UserID:      userID,
			Title:       &title1,
			SharedUntil: *testutils.CreateDateTime("9999-01-01"),
		},
	)
	assert.NoError(t, err)
	task2, err := database.GetOrCreateNote(
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
	_, err = database.GetOrCreateNote(
		db,
		userID,
		"123abc",
		"foobar_source",
		&database.Note{
			UserID:      notUserID,
			SharedUntil: *testutils.CreateDateTime("9999-01-01"),
		},
	)
	assert.NoError(t, err)
	isDeleted := true
	task3, err := database.GetOrCreateNote(
		db,
		userID,
		"123abcdogecoin",
		"foobar_source",
		&database.Note{
			UserID:      userID,
			Title:       &title3,
			SharedUntil: *testutils.CreateDateTime("9999-01-01"),
			IsDeleted:   &isDeleted,
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
		assert.Equal(t, 3, len(result))
		assert.Equal(t, []NoteResult{
			{
				ID:          task1.ID,
				Title:       "title1",
				SharedUntil: "9999-01-01T00:00:00Z",
			},
			{
				ID:          task2.ID,
				Title:       "title2",
				SharedUntil: "1999-01-01T00:00:00Z",
			},
			{
				ID:          task3.ID,
				Title:       "deleted note",
				SharedUntil: "9999-01-01T00:00:00Z",
				IsDeleted:   true,
			},
		}, result)
	})
}
