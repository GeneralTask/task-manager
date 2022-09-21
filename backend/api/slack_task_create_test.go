package api

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"strings"
	"testing"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestSlackTaskCreate(t *testing.T) {
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

	userID := primitive.NewObjectID()

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
		database.GetExternalTokenCollection(db).InsertOne(
			context.Background(),
			&database.ExternalAPIToken{
				ServiceID: external.TASK_SERVICE_ID_SLACK,
				AccountID: "invalid-team-valid-user",
			},
		)

		payloadDecoded := `{"type":"message_action","team":{"id":"invalid-team","domain":"generaltask"},"user":{"id":"valid-user","username":"invalid-user","team_id":"uhoh","name":"invalid-team"},"channel":{"id":"channel","name":"directmessage"},"is_enterprise_install":false,"enterprise":null,"callback_id":"create_task","trigger_id":"3874062481760.1734323190625.501316e39308b13eaaf3d8366810ff0d","message_ts":"1658791396.156309","message":{"client_msg_id":"client_msg_id","type":"message","text":"sounds+good,+will+take+a+look","user":"U02A0P4D61J","ts":"1658791396.156309","team":"invalid-team","blocks":[{"type":"rich_text","block_id":"ajF","elements":[{"type":"rich_text_section","elements":[{"type":"text","text":"sounds+good,+will+take+a+look"}]}]}]}}`
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

	t.Run("SuccessMessageAction", func(t *testing.T) {
		database.GetExternalTokenCollection(db).InsertOne(
			context.Background(),
			&database.ExternalAPIToken{
				ServiceID: external.TASK_SERVICE_ID_SLACK,
				AccountID: "valid-team-valid-user",
				Token:     `{"access_token": "example token"}`,
				UserID:    userID,
			},
		)

		payloadDecoded := `{"type":"message_action","team":{"id":"valid-team","domain":"generaltask"},"user":{"id":"valid-user","username":"valid-user","team_id":"uhoh","name":"valid-user"},"channel":{"id":"channel","name":"directmessage"},"is_enterprise_install":false,"enterprise":null,"callback_id":"create_task","trigger_id":"3874062481760.1734323190625.501316e39308b13eaaf3d8366810ff0d","message_ts":"1658791396.156309","message":{"client_msg_id":"client_msg_id","type":"message","text":"sounds+good,+will+take+a+look","user":"U02A0P4D61J","ts":"1658791396.156309","team":"invalid-team","blocks":[{"type":"rich_text","block_id":"ajF","elements":[{"type":"rich_text_section","elements":[{"type":"text","text":"sounds+good,+will+take+a+look"}]}]}]}}`
		payloadUrlEncoded := "payload=" + url.QueryEscape(payloadDecoded)

		server := getServerForSlack()
		defer server.Close()

		request, _ := http.NewRequest(
			"POST",
			"/tasks/create_external/slack/",
			bytes.NewBuffer([]byte(payloadUrlEncoded)))

		request.Header.Add("X-Slack-Request-Timestamp", validTimestamp)
		request.Header.Add("X-Slack-Signature", generateSlackSignature(validTimestamp, payloadUrlEncoded))
		request.Header.Add("Content-Type", "application/x-www-form-urlencoded")

		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		api.ExternalConfig.SlackOverrideURL = server.URL
		router := GetRouter(api)

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{}", string(body))
	})

	t.Run("SuccessViewSubmission", func(t *testing.T) {
		payloadDecoded := `{"type":"view_submission","team":{"id":"valid-team","domain":"generaltask"},"user":{"id":"valid-user","username":"christensen_julian","name":"christensen_julian","team_id":"valid-team"},"api_app_id":"exampleID","token":"exampleToken","trigger_id":"100000","view":{"id":"viewID","team_id":"T01ML9H5LJD","type":"modal","blocks":[{"type":"input","block_id":"task_title","label":{"type":"plain_text","text":"Enter a task title","emoji":true},"optional":true,"dispatch_action":false,"element":{"type":"plain_text_input","action_id":"task_title_input","placeholder":{"type":"plain_text","text":"Optional task title","emoji":true},"initial_value":"We're in a good place from backend, so no rush on it :pray:","dispatch_action_config":{"trigger_actions_on":["on_enter_pressed"]}}},{"type":"input","block_id":"task_details","label":{"type":"plain_text","text":"Enter task details","emoji":true},"optional":true,"dispatch_action":false,"element":{"type":"plain_text_input","action_id":"task_details_input","placeholder":{"type":"plain_text","text":"Optional task details","emoji":true},"multiline":true,"dispatch_action_config":{"trigger_actions_on":["on_enter_pressed"]}}}],"private_metadata":"{\"type\":\"message_action\",\"token\":\"MWEMxgr43bpbtSZ76MAZogeq\",\"action_ts\":\"1661978733.387772\",\"team\":{\"id\":\"T01ML9H5LJD\",\"domain\":\"generaltask\"},\"user\":{\"id\":\"U02A0P4D61J\",\"username\":\"christensen_julian\",\"team_id\":\"T01ML9H5LJD\",\"name\":\"christensen_julian\"},\"channel\":{\"id\":\"D02TW2A32TA\",\"name\":\"directmessage\"},\"is_enterprise_install\":false,\"enterprise\":null,\"callback_id\":\"create_task\",\"trigger_id\":\"4021928326340.1734323190625.0ef1985660b438da41a2417160735661\",\"response_url\":\"https:\\\/\\\/hooks.slack.com\\\/app\\\/T01ML9H5LJD\\\/4019478584866\\\/KfG79ChXNA3cpgRcfENdx9Ci\",\"message_ts\":\"1661977103.450919\",\"message\":{\"client_msg_id\":\"8848ce7e-3ca9-46fa-b3ac-753547cac174\",\"type\":\"message\",\"text\":\"We're in a good place from backend, so no rush on it :pray:\",\"user\":\"U02T3CDRX9B\",\"ts\":\"1661977103.450919\",\"team\":\"T01ML9H5LJD\",\"blocks\":[{\"type\":\"rich_text\",\"block_id\":\"9E7\",\"elements\":[{\"type\":\"rich_text_section\",\"elements\":[{\"type\":\"text\",\"text\":\"We're in a good place from backend, so no rush on it \"},{\"type\":\"emoji\",\"name\":\"pray\",\"unicode\":\"1f64f\"}]}]}]}}","callback_id":"","state":{"values":{"task_title":{"task_title_input":{"type":"plain_text_input","value":"We're in a good place from backend, so no rush on it :pray:"}},"task_details":{"task_details_input":{"type":"plain_text_input","value":null}}}},"hash":"1661978735.DB9YfLOH","title":{"type":"plain_text","text":"Create a new task","emoji":true},"clear_on_close":false,"notify_on_close":false,"close":{"type":"plain_text","text":"Cancel","emoji":true},"submit":{"type":"plain_text","text":"Submit","emoji":true},"previous_view_id":null,"root_view_id":"viewID","app_id":"app_id","external_id":"","app_installed_team_id":"teamid","bot_id":"botid"},"response_urls":[],"is_enterprise_install":false,"enterprise":null}`
		payloadUrlEncoded := "payload=" + url.QueryEscape(payloadDecoded)

		server := getServerForSlack()
		defer server.Close()

		request, _ := http.NewRequest(
			"POST",
			"/tasks/create_external/slack/",
			bytes.NewBuffer([]byte(payloadUrlEncoded)))

		request.Header.Add("X-Slack-Request-Timestamp", validTimestamp)
		request.Header.Add("X-Slack-Signature", generateSlackSignature(validTimestamp, payloadUrlEncoded))
		request.Header.Add("Content-Type", "application/x-www-form-urlencoded")

		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		api.ExternalConfig.SlackOverrideURL = server.URL
		router := GetRouter(api)

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{}", string(body))

		tasks, err := database.GetActiveTasks(db, userID)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(*tasks))
		task := (*tasks)[0]
		assert.Equal(t, "We're in a good place from backend, so no rush on it :pray:", *task.Title)
	})
}

func TestGetSlackMessageTitle(t *testing.T) {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()

	validTimestamp := "1355517523.000005"
	// set to dummy value because different secrets across Dev, CI, and Prod
	os.Setenv("SLACK_SIGNING_SECRET", "dummy value")
	defer os.Unsetenv("SLACK_SIGNING_SECRET")

	server := getServerForSlack()
	defer server.Close()

	sourceID := external.TASK_SOURCE_ID_SLACK_SAVED
	taskSourceResult, err := api.ExternalConfig.GetSourceResult(sourceID)
	assert.NoError(t, err)

	source := taskSourceResult.Source.(external.SlackSavedTaskSource)
	source.Slack.Config.ConfigValues.OverrideURL = &server.URL

	slackMessageParams := database.SlackMessageParams{
		Channel: database.SlackChannel{
			Name: "channel_name",
		},
		Message: database.SlackMessage{
			User:     "USERCODE",
			Text:     "HELLO!",
			TimeSent: validTimestamp,
		},
	}

	externalToken := database.ExternalAPIToken{
		Token: `{"access_token":"Hello!"}`,
	}

	t.Run("InvalidTimestamp", func(t *testing.T) {
		invalidParams := slackMessageParams
		invalidParams.Message.TimeSent = "HELLO.THERE"
		_, err := getSlackMessageTitle(source, invalidParams, &externalToken)
		assert.Error(t, err)
	})
	t.Run("SuccessDirectMessage", func(t *testing.T) {
		dmParams := slackMessageParams
		dmParams.Channel.Name = "directmessage"
		title, err := getSlackMessageTitle(source, dmParams, &externalToken)
		assert.NoError(t, err)
		// prefix to avoid timezone issues
		assert.True(t, strings.HasPrefix(title, "From  in a direct message @ 2012-12"))
	})
	t.Run("SuccessChannel", func(t *testing.T) {
		title, err := getSlackMessageTitle(source, slackMessageParams, &externalToken)
		assert.NoError(t, err)
		// prefix to avoid timezone issues
		assert.True(t, strings.HasPrefix(title, "From  in #channel_name @ 2012-12"))
	})
}

func getServerForSlack() *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))
}

func generateSlackSignature(timestamp string, payload string) string {
	signingSecret := config.GetConfigValue("SLACK_SIGNING_SECRET")
	hash := hmac.New(sha256.New, []byte(signingSecret))

	secretConstructor := "v0:" + timestamp + ":" + payload
	hash.Write([]byte(secretConstructor))
	return "v0=" + hex.EncodeToString(hash.Sum(nil))
}
