package api

import (
	"bytes"
	"context"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

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
	router := GetRouter(GetAPI())

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

		body := ServeRequest(t, authToken, "POST", "/tasks/create/gt_task/",
			bytes.NewBuffer([]byte(`{"title": "buy more dogecoin"}`)), http.StatusOK)

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

		body := ServeRequest(t, authToken, "POST", "/tasks/create/gt_task/",
			bytes.NewBuffer([]byte(`{"title": "buy more dogecoin", "body": "seriously!", "due_date": "2020-12-09T16:09:53+00:00", "time_duration": 300, "id_task_section": "`+customSectionID.Hex()+`"}`)),
			http.StatusOK)

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

	router := GetRouter(GetAPI())
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

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

		request.Header.Add("X-Slack-Request-Timestamp", "1355517523.000005")
		request.Header.Add("X-Slack-Signature", "v0=217eb7b584f4aacbc0298cce54aee21618f8c0dcf7be7304ea1c8e6b02d131ce")

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"payload not included in request\"}", string(body))
	})

	t.Run("TeamInvalid", func(t *testing.T) {
		request, _ := http.NewRequest(
			"POST",
			"/tasks/create_external/slack/",
			bytes.NewBuffer([]byte(`payload=%7B%22type%22%3A%22message_action%22%2C%22team%22%3A%7B%22id%22%3A%22invalid-team%22%2C%22domain%22%3A%22generaltask%22%7D%2C%22user%22%3A%7B%22id%22%3A%22invalid-user%22%2C%22username%22%3A%22invalid-user%22%2C%22team_id%22%3A%22uhoh%22%2C%22name%22%3A%22invalid-team%22%7D%2C%22channel%22%3A%7B%22id%22%3A%22channel%22%2C%22name%22%3A%22directmessage%22%7D%2C%22is_enterprise_install%22%3Afalse%2C%22enterprise%22%3Anull%2C%22callback_id%22%3A%22create_task%22%2C%22trigger_id%22%3A%223874062481760.1734323190625.501316e39308b13eaaf3d8366810ff0d%22%2C%22message_ts%22%3A%221658791396.156309%22%2C%22message%22%3A%7B%22client_msg_id%22%3A%22client_msg_id%22%2C%22type%22%3A%22message%22%2C%22text%22%3A%22sounds%2Bgood%2C%2Bwill%2Btake%2Ba%2Blook%22%2C%22user%22%3A%22U02A0P4D61J%22%2C%22ts%22%3A%221658791396.156309%22%2C%22team%22%3A%22invalid-team%22%2C%22blocks%22%3A%5B%7B%22type%22%3A%22rich_text%22%2C%22block_id%22%3A%22ajF%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22sounds%2Bgood%2C%2Bwill%2Btake%2Ba%2Blook%22%7D%5D%7D%5D%7D%5D%7D%7D`)))

		request.Header.Add("X-Slack-Request-Timestamp", "1355517523.000005")
		request.Header.Add("X-Slack-Signature", "v0=8291ef6ca981ccf5521fc4e6e6d724d0b5eb5467b3a2e716913575b677754e85")
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

		request, _ := http.NewRequest(
			"POST",
			"/tasks/create_external/slack/",
			bytes.NewBuffer([]byte(`payload=%7B%22type%22%3A%22message_action%22%2C%22team%22%3A%7B%22id%22%3A%22valid-team%22%2C%22domain%22%3A%22generaltask%22%7D%2C%22user%22%3A%7B%22id%22%3A%22valid-user%22%2C%22username%22%3A%22invalid-user%22%2C%22team_id%22%3A%22uhoh%22%2C%22name%22%3A%22invalid-team%22%7D%2C%22channel%22%3A%7B%22id%22%3A%22channel%22%2C%22name%22%3A%22directmessage%22%7D%2C%22is_enterprise_install%22%3Afalse%2C%22enterprise%22%3Anull%2C%22callback_id%22%3A%22create_task%22%2C%22trigger_id%22%3A%223874062481760.1734323190625.501316e39308b13eaaf3d8366810ff0d%22%2C%22message_ts%22%3A%221658791396.156309%22%2C%22message%22%3A%7B%22client_msg_id%22%3A%22client_msg_id%22%2C%22type%22%3A%22message%22%2C%22text%22%3A%22sounds%2Bgood%2C%2Bwill%2Btake%2Ba%2Blook%22%2C%22user%22%3A%22U02A0P4D61J%22%2C%22ts%22%3A%221658791396.156309%22%2C%22team%22%3A%22invalid-team%22%2C%22blocks%22%3A%5B%7B%22type%22%3A%22rich_text%22%2C%22block_id%22%3A%22ajF%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22sounds%2Bgood%2C%2Bwill%2Btake%2Ba%2Blook%22%7D%5D%7D%5D%7D%5D%7D%7D`)))

		request.Header.Add("X-Slack-Request-Timestamp", "1355517523.000005")
		request.Header.Add("X-Slack-Signature", "v0=e20b75b850ea9535b35e8958a05afb298d826932ba24bf2d85ba1d2b6ffc2033")
		request.Header.Add("Content-Type", "application/x-www-form-urlencoded")

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusInternalServerError, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"internal server error\"}", string(body))
	})

	t.Run("SuccessMessageAction", func(t *testing.T) {
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()

		database.GetExternalTokenCollection(db).InsertOne(
			dbCtx,
			&database.ExternalAPIToken{
				ServiceID: external.TASK_SERVICE_ID_SLACK,
				AccountID: "valid-team-valid-user-2",
				Token:     `{"access_token": "hello"}`,
			},
		)

		request, _ := http.NewRequest(
			"POST",
			"/tasks/create_external/slack/",
			bytes.NewBuffer([]byte(`payload=%7B%22type%22%3A%22message_action%22%2C%22team%22%3A%7B%22id%22%3A%22valid-team%22%2C%22domain%22%3A%22generaltask%22%7D%2C%22user%22%3A%7B%22id%22%3A%22valid-user-2%22%2C%22username%22%3A%22invalid-user%22%2C%22team_id%22%3A%22uhoh%22%2C%22name%22%3A%22invalid-team%22%7D%2C%22channel%22%3A%7B%22id%22%3A%22channel%22%2C%22name%22%3A%22directmessage%22%7D%2C%22is_enterprise_install%22%3Afalse%2C%22enterprise%22%3Anull%2C%22callback_id%22%3A%22create_task%22%2C%22trigger_id%22%3A%223874062481760.1734323190625.501316e39308b13eaaf3d8366810ff0d%22%2C%22message_ts%22%3A%221658791396.156309%22%2C%22message%22%3A%7B%22client_msg_id%22%3A%22client_msg_id%22%2C%22type%22%3A%22message%22%2C%22text%22%3A%22sounds%2Bgood%2C%2Bwill%2Btake%2Ba%2Blook%22%2C%22user%22%3A%22U02A0P4D61J%22%2C%22ts%22%3A%221658791396.156309%22%2C%22team%22%3A%22invalid-team%22%2C%22blocks%22%3A%5B%7B%22type%22%3A%22rich_text%22%2C%22block_id%22%3A%22ajF%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22sounds%2Bgood%2C%2Bwill%2Btake%2Ba%2Blook%22%7D%5D%7D%5D%7D%5D%7D%7D`)))

		request.Header.Add("X-Slack-Request-Timestamp", "1355517523.000005")
		request.Header.Add("X-Slack-Signature", "v0=2450a607e549a5808f45726a54534ba3f300323baad71a1eb95d9758006cf41a")
		request.Header.Add("Content-Type", "application/x-www-form-urlencoded")

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
	})
}
