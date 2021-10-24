package api

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
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

type GmailReplyParams struct {
	Raw      string `json:"raw"`
	ThreadID string `json:"threadId"`
}

func TestReplyToEmail(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	authToken := login("approved@generaltask.io", "General Tasker")
	userID := getUserIDFromAuthToken(t, db, authToken)

	taskCollection := database.GetTaskCollection(db)

	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	insertedResult, err := taskCollection.InsertOne(dbCtx, database.Email{
		TaskBase: database.TaskBase{
			UserID:     userID,
			IDExternal: "sample_message_id",
			Title:      "Sample subject",
			SourceID:   external.TASK_SOURCE_ID_GMAIL,
		},
		ThreadID: "sample_thread_id",
	})

	emailID := insertedResult.InsertedID.(primitive.ObjectID).Hex()
	assert.NoError(t, err)

	t.Run("MissingBody", func(t *testing.T) {
		router := GetRouter(GetAPI())

		request, _ := http.NewRequest(
			"POST",
			"/tasks/reply/"+emailID+"/",
			bytes.NewBuffer([]byte(`{"reply'": "test reply"}`)))

		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"missing `body` param\"}", string(body))
	})

	t.Run("InvalidTaskType", func(t *testing.T) {
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		insertedResult, err := taskCollection.InsertOne(dbCtx, database.Task{
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
			"/tasks/reply/"+taskID+"/",
			bytes.NewBuffer([]byte(`{"body": "test reply"}`)))

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
			"/tasks/reply/"+emailID+"/",
			bytes.NewBuffer([]byte(`{"body'": "test reply"}`)))

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
	})

	t.Run("TaskDoesNotBelongToUser", func(t *testing.T) {
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		insertedResult, err := taskCollection.InsertOne(dbCtx, database.Email{
			TaskBase: database.TaskBase{
				UserID:     primitive.NewObjectID(),
				IDExternal: "sample_message_id",
				Title:      "Sample subject",
				SourceID:   external.TASK_SOURCE_ID_GMAIL,
			},
			ThreadID: "sample_thread_id",
		})

		emailID := insertedResult.InsertedID.(primitive.ObjectID).Hex()
		assert.NoError(t, err)

		router := GetRouter(GetAPI())

		request, _ := http.NewRequest(
			"POST",
			"/tasks/reply/"+emailID+"/",
			bytes.NewBuffer([]byte(`{"body": "test reply"}`)))

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
				Value: "Sample sender <sample@generaltask.io>",
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
			"To: Sample sender <sample@generaltask.io>\r\nFrom: General Tasker <approved@generaltask.io>\nSubject: Re: Sample subject\nIn-Reply-To: <id1@gt.io>\nReferences: <id1@gt.io>\nMIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\ntest reply")

		testSuccessfulReplyWithServer(t, emailID, authToken, "test reply", server)
	})

	t.Run("SuccessReplyToAndExistingSubjectRe", func(t *testing.T) {
		var headers = []*gmail.MessagePartHeader{
			{
				Name:  "Subject",
				Value: "Re: Sample subject",
			},
			{
				Name:  "From",
				Value: "Sample sender <sample@generaltask.io>",
			},
			{
				Name:  "Reply-To",
				Value: "Reply address <reply@generaltask.io>",
			},
			{
				Name:  "Message-ID",
				Value: "<id2@gt.io>",
			},
			{
				Name:  "References",
				Value: "<id1@gt.io>",
			},
		}

		server := getReplyServer(t,
			"sample_message_id",
			"sample_thread_id",
			headers,
			"To: Reply address <reply@generaltask.io>\r\nFrom: General Tasker <approved@generaltask.io>\nSubject: Re: Sample subject\nIn-Reply-To: <id2@gt.io>\nReferences: <id1@gt.io> <id2@gt.io>\nMIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\ntest reply")

		testSuccessfulReplyWithServer(t, emailID, authToken, "test reply", server)
	})
}

func testSuccessfulReplyWithServer(t *testing.T,
	emailID string,
	authToken string,
	body string,
	server *httptest.Server) {
	api := GetAPI()
	api.ExternalConfig.GoogleOverrideURLs.GmailReplyURL = &server.URL
	router := GetRouter(api)

	request, _ := http.NewRequest(
		"POST",
		"/tasks/reply/"+emailID+"/",
		bytes.NewBuffer([]byte(`{"body": "`+body+`"}`)))

	request.Header.Add("Authorization", "Bearer "+authToken)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	assert.Equal(t, http.StatusCreated, recorder.Code)
}

func getReplyServer(t *testing.T,
	messageID string,
	threadID string,
	headers []*gmail.MessagePartHeader,
	expectedRawReply string) *httptest.Server {

	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "GET" {
			assert.Equal(t, "/gmail/v1/users/me/messages/"+messageID, r.URL.Path)
			w.WriteHeader(200)
			email := gmail.Message{
				Id: "sample_message_id",
				Payload: &gmail.MessagePart{
					Headers: headers,
				},
			}
			b, err := json.Marshal(email)
			assert.NoError(t, err)
			w.Write(b)
		} else if r.Method == "POST" {
			assert.Equal(t, "/gmail/v1/users/me/messages/send", r.URL.Path)

			var params GmailReplyParams
			json.NewDecoder(r.Body).Decode(&params)

			assert.Equal(t, threadID, params.ThreadID)
			decodedData, err := base64.URLEncoding.DecodeString(params.Raw)
			assert.NoError(t, err)
			assert.Equal(t, expectedRawReply, string(decodedData))

			w.WriteHeader(201)
			w.Write([]byte(`{}`))
		} else {
			assert.Fail(t, "Invalid Method")
		}
	}))
}
