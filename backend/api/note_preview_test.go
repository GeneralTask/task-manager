package api

import (
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/testutils"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestNotePreview(t *testing.T) {
	authToken := login("test_notes_preview@generaltask.com", "")
	title1 := "title1"
	title2 := "title2"

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
			Author:      "Elon",
			UserID:      userID,
			Title:       &title1,
			SharedUntil: *testutils.CreateDateTime("9999-01-01"),
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
			fmt.Sprintf("/note/%s/", primitive.NewObjectID()),
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
			fmt.Sprintf("/note/%s/", note2.ID.Hex()),
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
			fmt.Sprintf("/note/%s/", note1.ID.Hex()),
			nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)

		assert.Equal(t,
			`
<!DOCTYPE html>
<html>
<head>
	<title>title1</title>
	<meta http-equiv="Refresh" content="0; url='http://localhost:3000/note/`+note1.ID.Hex()+`'" />

	<meta property="og:title" content="title1" />
	<meta name="twitter:title" content="title1">

	<meta content="Note shared by Elon via General Task." property="og:description">
	<meta content="Note shared by Elon via General Task." property="twitter:description">

	<meta property="og:type" content="website" />
	<meta property="og:url" content="http://localhost:8080/note/`+note1.ID.Hex()+`/" />
</head>
<body>
</body>
</html>`,
			string(body))
	})
}
