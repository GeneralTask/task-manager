package api

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"testing"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestCreateTask(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	parentCtx := context.Background()

	authToken := login("approved@generaltask.com", "")
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	router := GetRouter(api)

	t.Run("BadSourceID", func(t *testing.T) {
		request, _ := http.NewRequest(
			"POST",
			"/tasks/create/dogecoin/",
			nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"not found\"}", string(body))
	})
	t.Run("UnsupportedSourceID", func(t *testing.T) {
		request, _ := http.NewRequest(
			"POST",
			"/tasks/create/gmail/",
			nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"not found\"}", string(body))
	})
	t.Run("MissingTitle", func(t *testing.T) {
		request, _ := http.NewRequest(
			"POST",
			"/tasks/create/gt_task/",
			nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"invalid or missing parameter\"}", string(body))
	})
	t.Run("WrongAccountID", func(t *testing.T) {
		// this currently isn't possible because only GT tasks are supported, but we should add this when it's possible
	})
	t.Run("BadTaskSection", func(t *testing.T) {
		authToken = login("create_task_bad_task_section@generaltask.com", "")

		request, _ := http.NewRequest(
			"POST",
			"/tasks/create/gt_task/",
			bytes.NewBuffer([]byte(`{"title": "foobar", "id_task_section": "`+primitive.NewObjectID().Hex()+`"}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"'id_task_section' is not a valid ID\"}", string(body))
	})
	t.Run("SuccessTitleOnly", func(t *testing.T) {
		authToken = login("create_task_success_title_only@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, db, authToken)

		body := ServeRequest(t, authToken, "POST", "/tasks/create/gt_task/", bytes.NewBuffer([]byte(`{"title": "buy more dogecoin"}`)), http.StatusOK)

		tasks, err := database.GetActiveTasks(db, userID)
		assert.NoError(t, err)
		assert.Equal(t, 4, len(*tasks))
		task := (*tasks)[3]
		assert.Equal(t, "buy more dogecoin", task.Title)
		assert.Equal(t, "", task.TaskBase.Body)
		assert.Equal(t, external.GeneralTaskDefaultAccountID, task.SourceAccountID)
		// 1 hour is the default
		assert.Equal(t, int64(3600000000000), task.TimeAllocation)
		assert.Equal(t, constants.IDTaskSectionDefault, task.IDTaskSection)
		assert.Equal(t, fmt.Sprintf("{\"task_id\":\"%s\"}", task.ID.Hex()), string(body))
	})
	t.Run("SuccessCustomSection", func(t *testing.T) {
		authToken = login("create_task_success_custom_section@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, db, authToken)
		sectionCollection := database.GetTaskSectionCollection(db)
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		res, err := sectionCollection.InsertOne(dbCtx, &database.TaskSection{UserID: userID, Name: "moooooon"})
		assert.NoError(t, err)
		customSectionID := res.InsertedID.(primitive.ObjectID)

		body := ServeRequest(t, authToken, "POST", "/tasks/create/gt_task/", bytes.NewBuffer([]byte(`{"title": "buy more dogecoin", "body": "seriously!", "due_date": "2020-12-09T16:09:53+00:00", "time_duration": 300, "id_task_section": "`+customSectionID.Hex()+`"}`)), http.StatusOK)

		tasks, err := database.GetActiveTasks(db, userID)
		assert.NoError(t, err)
		assert.Equal(t, 4, len(*tasks))
		task := (*tasks)[3]
		assert.Equal(t, "buy more dogecoin", task.Title)
		assert.Equal(t, "seriously!", task.TaskBase.Body)
		assert.Equal(t, int64(300000000000), task.TimeAllocation)
		assert.Equal(t, external.GeneralTaskDefaultAccountID, task.SourceAccountID)
		assert.Equal(t, customSectionID, task.IDTaskSection)
		assert.Equal(t, fmt.Sprintf("{\"task_id\":\"%s\"}", task.ID.Hex()), string(body))
	})
}

func TestSlackTaskCreate(t *testing.T) {
	parentCtx := context.Background()

	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	router := GetRouter(api)
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	validTimestamp := "1355517523.000005"
	// set to dummy value because different secrets across Dev, CI, and Prod
	os.Setenv("SLACK_SIGNING_SECRET", "dummy value")
	defer os.Unsetenv("SLACK_SIGNING_SECRET")

	t.Run("InvalidData", func(t *testing.T) {
		request, _ := http.NewRequest(
			"POST",
			"/tasks/create_external/slack/",
			bytes.NewBuffer([]byte(`{"payload": []}`)))

		request.Header.Add("X-Slack-Request-Timestamp", "invalid timestamp")
		request.Header.Add("X-Slack-Signature", "invalid signature")
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"signing secret invalid\"}", string(body))
	})

	t.Run("PayloadInvalid", func(t *testing.T) {
		request, _ := http.NewRequest(
			"POST",
			"/tasks/create_external/slack/",
			bytes.NewBuffer([]byte(`{"payload": []}`)))

		// signature is an encrypted version of timestamp and payload
		request.Header.Add("X-Slack-Request-Timestamp", validTimestamp)
		request.Header.Add("X-Slack-Signature", generateSlackSignature(validTimestamp, `{"payload": []}`))

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"payload not included in request\"}", string(body))
	})

	t.Run("TeamInvalid", func(t *testing.T) {
		payloadDecoded := `{"type":"message_action","team":{"id":"invalid-team","domain":"generaltask"},"user":{"id":"invalid-user","username":"invalid-user","team_id":"uhoh","name":"invalid-team"},"channel":{"id":"channel","name":"directmessage"},"is_enterprise_install":false,"enterprise":null,"callback_id":"create_task","trigger_id":"3874062481760.1734323190625.501316e39308b13eaaf3d8366810ff0d","message_ts":"1658791396.156309","message":{"client_msg_id":"client_msg_id","type":"message","text":"sounds+good,+will+take+a+look","user":"U02A0P4D61J","ts":"1658791396.156309","team":"invalid-team","blocks":[{"type":"rich_text","block_id":"ajF","elements":[{"type":"rich_text_section","elements":[{"type":"text","text":"sounds+good,+will+take+a+look"}]}]}]}}`
		payloadUrlEncoded := "payload=" + url.QueryEscape(payloadDecoded)

		request, _ := http.NewRequest(
			"POST",
			"/tasks/create_external/slack/",
			bytes.NewBuffer([]byte(payloadUrlEncoded)))

		request.Header.Add("X-Slack-Request-Timestamp", validTimestamp)
		request.Header.Add("X-Slack-Signature", generateSlackSignature(validTimestamp, payloadUrlEncoded))
		request.Header.Add("Content-Type", "application/x-www-form-urlencoded")

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusInternalServerError, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"internal server error\"}", string(body))
	})

	t.Run("InvalidOauthToken", func(t *testing.T) {
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()

		database.GetExternalTokenCollection(db).InsertOne(
			dbCtx,
			&database.ExternalAPIToken{
				ServiceID: external.TASK_SERVICE_ID_SLACK,
				AccountID: "valid-team-valid-user",
			},
		)

		payloadDecoded := `{"type":"message_action","team":{"id":"valid-team","domain":"generaltask"},"user":{"id":"valid-user","username":"invalid-user","team_id":"uhoh","name":"invalid-team"},"channel":{"id":"channel","name":"directmessage"},"is_enterprise_install":false,"enterprise":null,"callback_id":"create_task","trigger_id":"3874062481760.1734323190625.501316e39308b13eaaf3d8366810ff0d","message_ts":"1658791396.156309","message":{"client_msg_id":"client_msg_id","type":"message","text":"sounds+good,+will+take+a+look","user":"U02A0P4D61J","ts":"1658791396.156309","team":"invalid-team","blocks":[{"type":"rich_text","block_id":"ajF","elements":[{"type":"rich_text_section","elements":[{"type":"text","text":"sounds+good,+will+take+a+look"}]}]}]}}`
		payloadUrlEncoded := "payload=" + url.QueryEscape(payloadDecoded)

		request, _ := http.NewRequest(
			"POST",
			"/tasks/create_external/slack/",
			bytes.NewBuffer([]byte(payloadUrlEncoded)))

		request.Header.Add("X-Slack-Request-Timestamp", validTimestamp)
		request.Header.Add("X-Slack-Signature", generateSlackSignature(validTimestamp, payloadUrlEncoded))
		request.Header.Add("Content-Type", "application/x-www-form-urlencoded")

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusInternalServerError, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"internal server error\"}", string(body))
	})

	// TODO add success message action test: need URL overrides

	// TODO add success view submission test: need URL overrides
}

func generateSlackSignature(timestamp string, payload string) string {
	signingSecret := config.GetConfigValue("SLACK_SIGNING_SECRET")
	hash := hmac.New(sha256.New, []byte(signingSecret))

	secretConstructor := "v0:" + timestamp + ":" + payload
	hash.Write([]byte(secretConstructor))
	return "v0=" + hex.EncodeToString(hash.Sum(nil))
}
