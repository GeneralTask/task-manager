package api

import (
	"bytes"
	"context"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"google.golang.org/api/gmail/v1"
)

func TestComposeReplyToEmail(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	authToken := login("approved@generaltask.com", "General Tasker")
	userID := getUserIDFromAuthToken(t, db, authToken)

	taskCollection := database.GetTaskCollection(db)

	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	insertedResult, err := taskCollection.InsertOne(dbCtx, database.Item{
		TaskBase: database.TaskBase{
			UserID:     userID,
			IDExternal: "sample_message_id",
			Title:      "Sample subject",
			SourceID:   external.TASK_SOURCE_ID_GMAIL,
		},
		Email: database.Email{
			ThreadID: "sample_thread_id",
		},
	})

	emailID := insertedResult.InsertedID.(primitive.ObjectID).Hex()
	assert.NoError(t, err)

	t.Run("MissingBody", func(t *testing.T) {
		router := GetRouter(GetAPI())

		request, _ := http.NewRequest(
			"POST",
			"/messages/compose/",
			bytes.NewBuffer([]byte(`{"message_id'": "`+emailID+`"}`)))

		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"parameter missing or malformatted\"}", string(body))
	})

	t.Run("InvalidSourceID", func(t *testing.T) {
		router := GetRouter(GetAPI())

		request, _ := http.NewRequest(
			"POST",
			"/messages/compose/",
			bytes.NewBuffer([]byte(`{
				"message_id": "`+emailID+`",
				"body": "`+""+`",
				"recipients": {"to": [{"name": "Sample Recipient", "email": "sample@generaltask.com"}]},
				"source_id": "invalid_source",
				"source_account_id": "approved@generaltask.com"
			}`)))

		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"invalid source id\"}", string(body))
	})

	t.Run("InvalidTaskType", func(t *testing.T) {
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		insertedResult, err := taskCollection.InsertOne(dbCtx, database.Item{
			TaskBase: database.TaskBase{
				UserID:     userID,
				IDExternal: "sample_task_id",
				Title:      "Sample Task",
				SourceID:   external.TASK_SOURCE_ID_JIRA,
			},
		})

		taskID := insertedResult.InsertedID.(primitive.ObjectID).Hex()

		assert.NoError(t, err)

		router := GetRouter(GetAPI())

		request, _ := http.NewRequest(
			"POST",
			"/messages/compose/",
			bytes.NewBuffer([]byte(`{
				"message_id": "`+taskID+`",
				"body": "`+""+`",
				"recipients": {"to": [{"name": "Sample Recipient", "email": "sample@generaltask.com"}]},
				"source_id": "jira",
				"source_account_id": "approved@generaltask.com"
			}`)))

		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"task cannot be replied to\"}", string(body))
	})

	t.Run("Unauthorized", func(t *testing.T) {
		router := GetRouter(GetAPI())

		request, _ := http.NewRequest(
			"POST",
			"/messages/compose/",
			bytes.NewBuffer([]byte(`{
				"message_id": "`+emailID+`",
				"body": "`+""+`",
				"recipients": {"to": [{"name": "Sample Recipient", "email": "sample@generaltask.com"}]},
				"source_id": "gmail",
				"source_account_id": "approved@generaltask.com"
			}`)))

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
	})

	t.Run("TaskDoesNotBelongToUser", func(t *testing.T) {
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		insertedResult, err := taskCollection.InsertOne(dbCtx, database.Item{
			TaskBase: database.TaskBase{
				UserID:     primitive.NewObjectID(),
				IDExternal: "sample_message_id",
				Title:      "Sample subject",
				SourceID:   external.TASK_SOURCE_ID_GMAIL,
			},
			Email: database.Email{
				ThreadID: "sample_thread_id",
			},
		})

		emailID := insertedResult.InsertedID.(primitive.ObjectID).Hex()
		assert.NoError(t, err)

		router := GetRouter(GetAPI())

		request, _ := http.NewRequest(
			"POST",
			"/messages/compose/",
			bytes.NewBuffer([]byte(`{
				"message_id": "`+emailID+`",
				"body": "`+""+`",
				"recipients": {"to": [{"name": "Sample Recipient", "email": "sample@generaltask.com"}]},
				"source_id": "gmail",
				"source_account_id": "approved@generaltask.com"
			}`)))

		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
	})

	t.Run("SuccessNoReplyTo", func(t *testing.T) {
		var headers = []*gmail.MessagePartHeader{
			{
				Name:  "Subject",
				Value: "Sample subject",
			},
			{
				Name:  "From",
				Value: "Sample sender <sample@generaltask.com>",
			},
			{
				Name:  "Message-ID",
				Value: "<id1@gt.io>",
			},
		}

		server := getReplyServer(t,
			"sample_message_id",
			"sample_thread_id",
			headers,
			"To: Sample sender <sample@generaltask.com>\r\nCc: \r\nBcc: \r\nFrom: General Tasker <approved@generaltask.com>\nSubject: Re: Sample subject\nIn-Reply-To: <id1@gt.io>\nReferences: <id1@gt.io>\nMIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\ntest reply")
		toStr := `[{"name": "Sample sender", "email": "sample@generaltask.com"}]`
		testSuccessfulComposeWithServer(t, emailID, authToken, "test reply", toStr, "[]", "[]", server)
	})

	// t.Run("SuccessReplyToAndExistingSubjectRe", func(t *testing.T) {
	// 	var headers = []*gmail.MessagePartHeader{
	// 		{
	// 			Name:  "Subject",
	// 			Value: "Re: Sample subject",
	// 		},
	// 		{
	// 			Name:  "From",
	// 			Value: "Sample sender <sample@generaltask.com>",
	// 		},
	// 		{
	// 			Name:  "Reply-To",
	// 			Value: "Reply address <reply@generaltask.com>",
	// 		},
	// 		{
	// 			Name:  "Message-ID",
	// 			Value: "<id2@gt.io>",
	// 		},
	// 		{
	// 			Name:  "References",
	// 			Value: "<id1@gt.io>",
	// 		},
	// 	}

	// 	server := getReplyServer(t,
	// 		"sample_message_id",
	// 		"sample_thread_id",
	// 		headers,
	// 		"To: Reply address <reply@generaltask.com>\r\nCc: \r\nBcc: \r\nFrom: General Tasker <approved@generaltask.com>\nSubject: Re: Sample subject\nIn-Reply-To: <id2@gt.io>\nReferences: <id1@gt.io> <id2@gt.io>\nMIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\ntest reply")

	// 	// testSuccessfulReplyWithServer(t, emailID, authToken, "test reply", server)
	// 	testSuccessfulComposeWithServer(t, emailID, authToken, "test reply", server)
	// })
}

func testSuccessfulComposeWithServer(t *testing.T,
	emailID string,
	authToken string,
	body string,
	toStr string,
	ccStr string,
	bccStr string,
	server *httptest.Server) {
	api := GetAPI()
	api.ExternalConfig.GoogleOverrideURLs.GmailReplyURL = &server.URL
	router := GetRouter(api)

	request, _ := http.NewRequest(
		"POST",
		"/messages/compose/",
		bytes.NewBuffer([]byte(`{
			"message_id": "`+emailID+`",
			"body": "`+body+`",
			"recipients": {
				"to": `+ toStr +`,
				"cc": `+ ccStr +`,
				"bcc": `+ bccStr +`
			},
			"source_id": "gmail",
			"source_account_id": "approved@generaltask.com"
		}`)))

	// "/messages/compose/",
	// bytes.NewBuffer([]byte(`{
	// 	"body": "`+body+`",
	// 	"message_id": "` + emailID + `",
	// 	"recipients": {
	// 		"to": [{"name": "Mike Yo22", "email": "gng.vike13@gmail.com"}, {"name": "Mark Smith", "email": "gng.vike13+to_2@gmail.com"}, {"name": "", "email": "gng.vike13+to_3@gmail.com"}],
	// 		"cc": [{"name": "Jon Bravo", "email": "gng.vike13+cc_1@gmail.com"}],
	// 		"bcc": [{"name": "Stan Lee", "email": "gng.vike13+bcc_1@gmail.com"}]
	// 	},
	// 	"source_id": "gmail",
	// 	"source_account_id": "maz@generaltask.com"
	// }`)))

	request.Header.Add("Authorization", "Bearer "+authToken)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	assert.Equal(t, http.StatusCreated, recorder.Code)
}