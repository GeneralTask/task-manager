package api

import (
	"context"
	"encoding/json"
	"github.com/GeneralTask/task-manager/backend/config"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"regexp"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func TestAuthorizeJIRA(t *testing.T) {
	t.Run("CookieMissing", func(t *testing.T) {
		router := GetRouter(&API{})
		request, _ := http.NewRequest("GET", "/authorize/jira/", nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(
			t,
			"{\"detail\":\"missing authToken cookie\"}",
			string(body),
		)
	})
	t.Run("CookieBad", func(t *testing.T) {
		router := GetRouter(&API{})
		request, _ := http.NewRequest("GET", "/authorize/jira/", nil)
		request.AddCookie(&http.Cookie{Name: "authToken", Value: "tothemoon"})
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(
			t,
			"{\"detail\":\"invalid auth token\"}",
			string(body),
		)
	})
	t.Run("Success", func(t *testing.T) {
		router := GetRouter(&API{})
		request, _ := http.NewRequest("GET", "/authorize/jira/", nil)
		authToken := login("approved@generaltask.io")
		request.AddCookie(&http.Cookie{Name: "authToken", Value: authToken})
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusFound, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		// Grab from body where we expect the state token
		exp := regexp.MustCompile("state=([^&]+)&")
		matches := exp.FindStringSubmatch(string(body))
		assert.Equal(t,2,  len(matches))
		stateToken := matches[1]
		assert.NoError(t, err)
		assert.Equal(
			t,
			"<a href=\"https://auth.atlassian.com/authorize?audience=api.atlassian.com&amp;client_id=" + config.GetConfigValue("JIRA_OAUTH_CLIENT_ID") + "&amp;scope=offline_access%20read%3Ajira-user%20read%3Ajira-work%20write%3Ajira-work&amp;redirect_uri=" + config.GetConfigValue("SERVER_URL") + "authorize%2Fjira%2Fcallback%2F&amp;state="+stateToken+"&amp;response_type=code&amp;prompt=consent\">Found</a>.\n\n",
			string(body),
		)
	})
}

func TestAuthorizeJIRACallback(t *testing.T) {
	t.Run("CookieMissing", func(t *testing.T) {
		router := GetRouter(&API{})
		request, _ := http.NewRequest("GET", "/authorize/jira/callback/", nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(
			t,
			"{\"detail\":\"missing authToken cookie\"}",
			string(body),
		)
	})
	t.Run("CookieBad", func(t *testing.T) {
		router := GetRouter(&API{})
		request, _ := http.NewRequest("GET", "/authorize/jira/callback/", nil)
		request.AddCookie(&http.Cookie{Name: "authToken", Value: "tothemoon"})
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(
			t,
			"{\"detail\":\"invalid auth token\"}",
			string(body),
		)
	})
	t.Run("MissingCodeParam", func(t *testing.T) {
		router := GetRouter(&API{})
		request, _ := http.NewRequest("GET", "/authorize/jira/callback/", nil)
		authToken := login("approved@generaltask.io")
		request.AddCookie(&http.Cookie{Name: "authToken", Value: authToken})
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(
			t,
			"{\"detail\":\"Missing query params\"}",
			string(body),
		)
	})
	t.Run("BadStateTokenFormat", func(t *testing.T) {
		router := GetRouter(&API{})
		request, _ := http.NewRequest("GET", "/authorize/jira/callback/?code=123abc&state=oopsie", nil)
		authToken := login("approved@generaltask.io")
		request.AddCookie(&http.Cookie{Name: "authToken", Value: authToken})
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(
			t,
			"{\"detail\":\"Invalid state token format\"}",
			string(body),
		)
	})
	t.Run("InvalidStateToken", func(t *testing.T) {
		router := GetRouter(&API{})
		request, _ := http.NewRequest("GET", "/authorize/jira/callback/?code=123abc&state=6088e1c97018a22f240aa573", nil)
		authToken := login("approved@generaltask.io")
		request.AddCookie(&http.Cookie{Name: "authToken", Value: authToken})
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(
			t,
			"{\"detail\":\"Invalid state token\"}",
			string(body),
		)
	})
	t.Run("InvalidStateTokenWrongUser", func(t *testing.T) {
		db, dbCleanup := database.GetDBConnection()
		defer dbCleanup()
		randomUserID := primitive.NewObjectID()
		stateToken := database.CreateStateToken(db, &randomUserID)

		router := GetRouter(&API{})
		request, _ := http.NewRequest("GET", "/authorize/jira/callback/?code=123abc&state="+stateToken, nil)
		authToken := login("approved@generaltask.io")
		request.AddCookie(&http.Cookie{Name: "authToken", Value: authToken})
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(
			t,
			"{\"detail\":\"Invalid state token\"}",
			string(body),
		)
	})
	t.Run("UnsuccessfulResponse", func(t *testing.T) {
		authToken := login("approved@generaltask.io")
		stateToken := newStateToken(authToken)

		server := getTokenServerForJIRA(t, http.StatusUnauthorized)
		router := GetRouter(&API{JIRAConfigValues: JIRAConfig{TokenURL: &server.URL}})
		request, _ := http.NewRequest("GET", "/authorize/jira/callback/?code=123abc&state="+stateToken, nil)
		request.AddCookie(&http.Cookie{Name: "authToken", Value: authToken})
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(
			t,
			"{\"detail\":\"Authorization failed\"}",
			string(body),
		)
	})
	t.Run("Success", func(t *testing.T) {
		authToken := login("approved@generaltask.io")
		stateToken := newStateToken(authToken)

		server := getTokenServerForJIRA(t, http.StatusOK)
		router := GetRouter(&API{JIRAConfigValues: JIRAConfig{TokenURL: &server.URL}})
		request, _ := http.NewRequest("GET", "/authorize/jira/callback/?code=123abc&state="+stateToken, nil)
		request.AddCookie(&http.Cookie{Name: "authToken", Value: authToken})
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusFound, recorder.Code)

		db, dbCleanup := database.GetDBConnection()
		defer dbCleanup()
		internalAPITokenCollection := db.Collection("internal_api_tokens")
		var authTokenStruct database.InternalAPIToken
		err := internalAPITokenCollection.FindOne(context.TODO(), bson.D{{Key: "token", Value: authToken}}).Decode(&authTokenStruct)
		assert.NoError(t, err)
		externalAPITokenCollection := db.Collection("external_api_tokens")
		count, err := externalAPITokenCollection.CountDocuments(context.TODO(), bson.D{{Key: "user_id", Value: authTokenStruct.UserID}, {Key: "source", Value: "jira"}})
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)
		var jiraToken database.ExternalAPIToken
		err = externalAPITokenCollection.FindOne(context.TODO(), bson.D{{Key: "user_id", Value: authTokenStruct.UserID}, {Key: "source", Value: "jira"}}).Decode(&jiraToken)
		assert.NoError(t, err)
		assert.Equal(t, "jira", jiraToken.Source)
	})
}

func TestLoadJIRATasks(t *testing.T) {
	db, dbCleanup := database.GetDBConnection()
	defer dbCleanup()
	externalAPITokenCollection := db.Collection("external_api_tokens")

	t.Run("MissingJIRAToken", func(t *testing.T) {
		var JIRATasks = make(chan []*database.Task)
		userID := primitive.NewObjectID()
		go LoadJIRATasks(&API{}, userID, JIRATasks)
		result := <-JIRATasks
		assert.Equal(t, 0, len(result))
	})
	t.Run("RefreshTokenFailed", func(t *testing.T) {
		userID := createJIRAToken(t, externalAPITokenCollection)
		tokenServer := getTokenServerForJIRA(t, http.StatusUnauthorized)
		var JIRATasks = make(chan []*database.Task)
		go LoadJIRATasks(&API{JIRAConfigValues: JIRAConfig{TokenURL: &tokenServer.URL}}, *userID, JIRATasks)
		result := <-JIRATasks
		assert.Equal(t, 0, len(result))
	})
	t.Run("CloudIDFetchFailed", func(t *testing.T) {
		userID := createJIRAToken(t, externalAPITokenCollection)
		cloudIDServer := getCloudIDServerForJIRA(t, http.StatusUnauthorized, false)
		tokenServer := getTokenServerForJIRA(t, http.StatusOK)
		var JIRATasks = make(chan []*database.Task)
		go LoadJIRATasks(&API{JIRAConfigValues: JIRAConfig{CloudIDURL: &cloudIDServer.URL, TokenURL: &tokenServer.URL}}, *userID, JIRATasks)
		result := <-JIRATasks
		assert.Equal(t, 0, len(result))
	})
	t.Run("EmptyCloudIDResponse", func(t *testing.T) {
		userID := createJIRAToken(t, externalAPITokenCollection)
		cloudIDServer := getCloudIDServerForJIRA(t, http.StatusOK, true)
		tokenServer := getTokenServerForJIRA(t, http.StatusOK)
		var JIRATasks = make(chan []*database.Task)
		go LoadJIRATasks(&API{JIRAConfigValues: JIRAConfig{CloudIDURL: &cloudIDServer.URL, TokenURL: &tokenServer.URL}}, *userID, JIRATasks)
		result := <-JIRATasks
		assert.Equal(t, 0, len(result))
	})
	t.Run("SearchFailed", func(t *testing.T) {
		userID := createJIRAToken(t, externalAPITokenCollection)
		cloudIDServer := getCloudIDServerForJIRA(t, http.StatusOK, false)
		tokenServer := getTokenServerForJIRA(t, http.StatusOK)
		searchServer := getSearchServerForJIRA(t, http.StatusUnauthorized, false)
		var JIRATasks = make(chan []*database.Task)
		go LoadJIRATasks(&API{JIRAConfigValues: JIRAConfig{APIBaseURL: &searchServer.URL, CloudIDURL: &cloudIDServer.URL, TokenURL: &tokenServer.URL}}, *userID, JIRATasks)
		result := <-JIRATasks
		assert.Equal(t, 0, len(result))
	})
	t.Run("EmptySearchResponse", func(t *testing.T) {
		userID := createJIRAToken(t, externalAPITokenCollection)
		cloudIDServer := getCloudIDServerForJIRA(t, http.StatusOK, false)
		tokenServer := getTokenServerForJIRA(t, http.StatusOK)
		searchServer := getSearchServerForJIRA(t, http.StatusOK, true)
		var JIRATasks = make(chan []*database.Task)
		go LoadJIRATasks(&API{JIRAConfigValues: JIRAConfig{APIBaseURL: &searchServer.URL, CloudIDURL: &cloudIDServer.URL, TokenURL: &tokenServer.URL}}, *userID, JIRATasks)
		result := <-JIRATasks
		assert.Equal(t, 0, len(result))
	})
	t.Run("Success", func(t *testing.T) {
		userID := createJIRAToken(t, externalAPITokenCollection)
		cloudIDServer := getCloudIDServerForJIRA(t, http.StatusOK, false)
		tokenServer := getTokenServerForJIRA(t, http.StatusOK)
		searchServer := getSearchServerForJIRA(t, http.StatusOK, false)
		var JIRATasks = make(chan []*database.Task)
		go LoadJIRATasks(&API{JIRAConfigValues: JIRAConfig{APIBaseURL: &searchServer.URL, CloudIDURL: &cloudIDServer.URL, TokenURL: &tokenServer.URL}}, *userID, JIRATasks)
		result := <-JIRATasks
		assert.Equal(t, 1, len(result))

		dueDate, _ := time.Parse("2006-01-02", "2021-04-20")
		expectedTask := database.Task{
			TaskBase: database.TaskBase{
				IDOrdering: 0,
				IDExternal: "42069",
				Deeplink:   "https://dankmemes.com/browse/MOON-1969",
				Title:      "Sample Taskeroni",
				Source:     database.TaskSourceJIRA.Name,
				Logo:       database.TaskSourceJIRA.Logo,
			},
			DueDate: primitive.NewDateTimeFromTime(dueDate),
		}
		assertTasksEqual(t, &expectedTask, result[0])

		db, dbCleanup := database.GetDBConnection()
		defer dbCleanup()
		taskCollection := db.Collection("tasks")

		var taskFromDB database.Task
		err := taskCollection.FindOne(context.TODO(), bson.D{{Key: "source", Value: database.TaskSourceJIRA.Name}, {Key: "id_external", Value: "42069"}}).Decode(&taskFromDB)
		assert.NoError(t, err)
		assertTasksEqual(t, &expectedTask, &taskFromDB)
	})
}

func assertTasksEqual(t *testing.T, a *database.Task, b *database.Task) {
	assert.Equal(t, a.Deeplink, b.Deeplink)
	assert.Equal(t, a.IDExternal, b.IDExternal)
	assert.Equal(t, a.IDOrdering, b.IDOrdering)
	assert.Equal(t, a.Logo, b.Logo)
	assert.Equal(t, a.Title, b.Title)
	assert.Equal(t, a.Source, b.Source)
}

func createJIRAToken(t *testing.T, externalAPITokenCollection *mongo.Collection) *primitive.ObjectID {
	userID := primitive.NewObjectID()
	_, err := externalAPITokenCollection.InsertOne(
		context.Background(),
		&database.ExternalAPIToken{
			Source: "jira",
			Token:  `{"access_token":"sample-token","refresh_token":"sample-token","scope":"sample-scope","expires_in":3600,"token_type":"Bearer"}`,
			UserID: userID,
		},
	)
	assert.NoError(t, err)
	return &userID
}

func getCloudIDServerForJIRA(t *testing.T, statusCode int, empty bool) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "Bearer sample-access-token", r.Header.Get("Authorization"))
		body, err := ioutil.ReadAll(r.Body)
		assert.NoError(t, err)
		assert.Equal(t, "", string(body))
		w.WriteHeader(statusCode)
		if empty {
			w.Write([]byte(`[]`))
		} else {
			w.Write([]byte(`[{"id": "teslatothemoon42069", "url": "https://dankmemes.com"}]`))
		}
	}))
}

func getSearchServerForJIRA(t *testing.T, statusCode int, empty bool) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "Bearer sample-access-token", r.Header.Get("Authorization"))
		body, err := ioutil.ReadAll(r.Body)
		assert.NoError(t, err)
		assert.Equal(t, "", string(body))
		w.WriteHeader(statusCode)
		if empty {
			result, err := json.Marshal(JIRATaskList{Issues: []JIRATask{}})
			assert.NoError(t, err)
			w.Write(result)
		} else {
			result, err := json.Marshal(JIRATaskList{Issues: []JIRATask{{
				Fields: JIRATaskFields{DueDate: "2021-04-20", Summary: "Sample Taskeroni"},
				ID:     "42069",
				Key:    "MOON-1969",
			}}})
			assert.NoError(t, err)
			w.Write(result)
		}
	}))
}

func getTokenServerForJIRA(t *testing.T, statusCode int) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, err := ioutil.ReadAll(r.Body)
		assert.NoError(t, err)
		w.WriteHeader(statusCode)
		w.Write([]byte(`{"access_token":"sample-access-token","refresh_token":"sample-refresh-token","scope":"sample-scope","expires_in":3600,"token_type":"Bearer"}`))
	}))
}

func getTransitionIDServerForJIRA(t *testing.T) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, r.RequestURI, "/rest/api/3/issue/sample_jira_id/transitions")
		if r.Method == "GET" {
			w.WriteHeader(200)
			w.Write([]byte(`{"transitions": [{"id": "100"}]}`))
		} else if r.Method == "POST" {
			body, err := ioutil.ReadAll(r.Body)
			assert.NoError(t, err)
			assert.Equal(t, "{\"transition\": {\"id\": \"100\"}}", string(body))
			w.WriteHeader(204)
		} else {
			w.WriteHeader(400)
		}
	}))
}