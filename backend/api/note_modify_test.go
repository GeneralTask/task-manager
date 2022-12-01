package api

import (
	"bytes"
	"context"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/testutils"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"net/http"
	"testing"
)

func TestNoteModifyEditFields(t *testing.T) {
	authToken := login("test_notes_modify@generaltask.com", "")
	true_val := true
	title1 := "title1"
	body1 := "body1"

	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := getUserIDFromAuthToken(t, db, authToken)
	note1, err := database.GetOrCreateNote(
		db,
		userID,
		"123abc",
		"foobar_source",
		&database.Note{
			UserID:             userID,
			Title:              &title1,
			Body:               &body1,
			AuthorDisplayEmail: "author1",
			IsShared:           &true_val,
			CreatedAt:          *testutils.CreateDateTime("2020-04-20"),
			UpdatedAt:          *testutils.CreateDateTime("2020-04-20"),
		},
	)

	UnauthorizedTest(t, "PATCH", "/notes/modify/123/", nil)
	t.Run("InvalidNoteID", func(t *testing.T) {
		response := ServeRequest(t, authToken, "PATCH", "/notes/modify/123/", nil, http.StatusNotFound, nil)
		assert.Equal(t, "{\"detail\":\"not found\"}", string(response))
	})
	t.Run("Success", func(t *testing.T) {
		response := ServeRequest(t, authToken, "PATCH", "/notes/modify/"+note1.ID.Hex()+"/",
			bytes.NewBuffer([]byte(`{"title": "new title", "body": "new body", "author": "new author", "is_shared": false}`)), http.StatusOK, nil)
		assert.Equal(t, "{}", string(response))

		var note database.Note
		err = database.GetNoteCollection(db).FindOne(context.Background(), bson.M{"_id": note1.ID}).Decode(&note)
		assert.NoError(t, err)
		assert.Equal(t, "new title", *note.Title)
		assert.Equal(t, "new body", *note.Body)
		assert.Equal(t, "new author", note.AuthorDisplayEmail)
		assert.Equal(t, *testutils.CreateDateTime("2020-04-20"), note.CreatedAt)
		assert.Greater(t, note.UpdatedAt, *testutils.CreateDateTime("2020-04-20"))
		assert.Equal(t, false, *note.IsShared)
	})
}
