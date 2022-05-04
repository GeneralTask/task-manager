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

func TestComposeEmail(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	authToken := login("approved@generaltask.com", "General Tasker")
	userID := getUserIDFromAuthToken(t, db, authToken)

	taskCollection := database.GetTaskCollection(db)

	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()

	//messageID := "sample_message_id"
	messageID := primitive.NewObjectID()
	_, err = taskCollection.InsertOne(dbCtx, database.Item{
		TaskBase: database.TaskBase{
			UserID:     userID,
			IDExternal: "sample_thread_id",
			Title:      "Sample subject",
			SourceID:   external.TASK_SOURCE_ID_GMAIL,
		},
		EmailThread: database.EmailThread{
			ThreadID: "sample_thread_id",
			Emails: []database.Email{{
				MessageID: messageID,
				ThreadID:  "sample_thread_id",
				EmailID:   "sample_email_id",
			}},
		},
	})

	t.Run("MissingBody", func(t *testing.T) {
		router := GetRouter(GetAPI())

		request, _ := http.NewRequest(
			"POST",
			"/messages/compose/",
			bytes.NewBuffer([]byte(`{"message_id'": "`+messageID.Hex()+`"}`)))

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
				"message_id": "`+messageID.Hex()+`",
				"body": "`+"test body"+`",
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
				"body": "`+"test body"+`",
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
				"message_id": "`+messageID.Hex()+`",
				"body": "`+"test body"+`",
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

		nonUserSmtpId := primitive.NewObjectID()
		_, err = taskCollection.InsertOne(dbCtx, database.Item{
			TaskBase: database.TaskBase{
				UserID:     primitive.NewObjectID(),
				IDExternal: "sample_thread_id",
				Title:      "Sample subject",
				SourceID:   external.TASK_SOURCE_ID_GMAIL,
			},
			EmailThread: database.EmailThread{
				ThreadID: "sample_thread_id",
				Emails: []database.Email{{
					MessageID: nonUserSmtpId,
					ThreadID:  "sample_thread_id",
					EmailID:   "sample_email_id",
				}},
			},
		})
		router := GetRouter(GetAPI())

		request, _ := http.NewRequest(
			"POST",
			"/messages/compose/",
			bytes.NewBuffer([]byte(`{
				"message_id": "`+nonUserSmtpId.Hex()+`",
				"body": "`+"test body"+`",
				"recipients": {"to": [{"name": "Sample Recipient", "email": "sample@generaltask.com"}]},
				"source_id": "gmail",
				"source_account_id": "approved@generaltask.com"
			}`)))

		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusServiceUnavailable, recorder.Code)
	})

	t.Run("SuccessReply", func(t *testing.T) {
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
			"sample_email_id",
			"sample_thread_id",
			headers,
			"To: Sample sender <sample@generaltask.com>\r\nFrom: General Tasker <approved@generaltask.com>\nSubject: Re: Sample subject\nIn-Reply-To: <id1@gt.io>\nReferences: <id1@gt.io>\nMIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\ntest reply")
		toStr := `[{"name": "Sample sender", "email": "sample@generaltask.com"}]`
		testSuccessfulComposeWithServer(t, messageID.Hex(), authToken, "test reply", "", toStr, "[]", "[]", server)
	})

	t.Run("SuccessCompose", func(t *testing.T) {
		var headers = []*gmail.MessagePartHeader{}

		server := getReplyServer(t,
			"sample_message_id",
			"",
			headers,
			"To: Sample sender <sample@generaltask.com>\r\nCc: \r\nBcc: \r\nFrom: General Tasker <approved@generaltask.com>\nSubject: test subject\n\ntest body")
		toStr := `[{"name": "Sample sender", "email": "sample@generaltask.com"}]`
		testSuccessfulComposeWithServer(t, "", authToken, "test body", "test subject", toStr, "[]", "[]", server)
	})

	t.Run("SuccessComposeEmptyBody", func(t *testing.T) {
		var headers = []*gmail.MessagePartHeader{}
		server := getReplyServer(t,
			"sample_email_id",
			"",
			headers,
			"To: Sample sender <sample@generaltask.com>\r\nCc: \r\nBcc: \r\nFrom: General Tasker <approved@generaltask.com>\nSubject: test subject\n\n")
		toStr := `[{"name": "Sample sender", "email": "sample@generaltask.com"}]`
		testSuccessfulComposeWithServer(t, "", authToken, "", "test subject", toStr, "[]", "[]", server)
	})

	t.Run("SuccessComposeMultipleRecipients", func(t *testing.T) {
		var headers = []*gmail.MessagePartHeader{}
		server := getReplyServer(t,
			"sample_message_id",
			"",
			headers,
			"To: Sample sender <sample@generaltask.com>,Sample sender 2 <sample2@generaltask.com>\r\nCc: Sample sender cc <samplecc@generaltask.com>\r\nBcc: Sample sender bcc <samplebcc@generaltask.com>\r\nFrom: General Tasker <approved@generaltask.com>\nSubject: test subject\n\ntest reply")
		toStr := `[{"name": "Sample sender", "email": "sample@generaltask.com"},{"name": "Sample sender 2", "email": "sample2@generaltask.com"}]`
		ccStr := `[{"name": "Sample sender cc", "email": "samplecc@generaltask.com"}]`
		bccStr := `[{"name": "Sample sender bcc", "email": "samplebcc@generaltask.com"}]`
		testSuccessfulComposeWithServer(t, "", authToken, "test reply", "test subject", toStr, ccStr, bccStr, server)
	})
}

func testSuccessfulComposeWithServer(t *testing.T,
	messageID string,
	authToken string,
	body string,
	subject string,
	toStr string,
	ccStr string,
	bccStr string,
	server *httptest.Server) {
	api := GetAPI()
	api.ExternalConfig.GoogleOverrideURLs.GmailReplyURL = &server.URL
	api.ExternalConfig.GoogleOverrideURLs.GmailSendURL = &server.URL
	router := GetRouter(api)

	messageIDStr := ""
	if len(messageID) > 0 {
		messageIDStr = `"message_id": "` + messageID + `",`
	}

	subjectStr := ""
	if len(subject) > 0 {
		messageIDStr = `"subject": "` + subject + `",`
	}

	request, _ := http.NewRequest(
		"POST",
		"/messages/compose/",
		bytes.NewBuffer([]byte(`{
			`+messageIDStr+`
			`+subjectStr+`
			"body": "`+body+`",
			"recipients": {
				"to": `+toStr+`,
				"cc": `+ccStr+`,
				"bcc": `+bccStr+`
			},
			"source_id": "gmail",
			"source_account_id": "approved@generaltask.com"
		}`)))

	request.Header.Add("Authorization", "Bearer "+authToken)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	assert.Equal(t, http.StatusCreated, recorder.Code)
}

type GmailReplyParams struct {
	Raw      string `json:"raw"`
	ThreadID string `json:"threadId"`
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
