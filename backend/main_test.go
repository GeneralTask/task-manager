package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"google.golang.org/api/calendar/v3"
	"google.golang.org/api/googleapi"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.mongodb.org/mongo-driver/bson"
	"golang.org/x/oauth2"
)

type MockGoogleConfig struct {
	mock.Mock
}

func (m *MockGoogleConfig) AuthCodeURL(state string, opts ...oauth2.AuthCodeOption) string {
	ret := m.Called(state, opts)
	url := ret.Get(0).(string)
	return url
}

func (m *MockGoogleConfig) Client(ctx context.Context, t *oauth2.Token) HTTPClient {
	ret := m.Called(ctx, t)
	client := ret.Get(0).(*MockHTTPClient)
	return client
}

func (m *MockGoogleConfig) Exchange(ctx context.Context, code string, opts ...oauth2.AuthCodeOption) (*oauth2.Token, error) {
	ret := m.Called(ctx, code)
	token := ret.Get(0).(*oauth2.Token)
	var err error
	if ret.Get(1) != nil {
		err = ret.Get(1).(error)
	}
	return token, err
}

type MockHTTPClient struct {
	mock.Mock
}

func (c *MockHTTPClient) Get(url string) (*http.Response, error) {
	ret := c.Called(url)
	resp := ret.Get(0).(*http.Response)
	var err error
	if ret.Get(1) != nil {
		err = ret.Get(1).(error)
	}
	return resp, err
}

func TestAuthorizeJIRA(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		router := getRouter(&API{})
		request, _ := http.NewRequest("GET", "/authorize/jira/", nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusFound, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(
			t,
			"<a href=\"https://auth.atlassian.com/authorize?audience=api.atlassian.com&amp;client_id=7sW3nPubP5vLDktjR2pfAU8cR67906X0&amp;scope=offline_access%20read%3Ajira-user%20read%3Ajira-work%20write%3Ajira-work&amp;redirect_uri=https%3A%2F%2Fapi.generaltask.io%2Fauthorize2%2Fjira%2Fcallback%2F&amp;state=state-token&amp;response_type=code&amp;prompt=consent\">Found</a>.\n\n",
			string(body),
		)
	})
}

func TestAuthorizeJIRACallback(t *testing.T) {
	t.Run("CookieMissing", func(t *testing.T) {
		router := getRouter(&API{})
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
		router := getRouter(&API{})
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
		router := getRouter(&API{})
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
	t.Run("UnsuccessfulResponse", func(t *testing.T) {
		server := getTokenServerForJIRA(t, http.StatusUnauthorized, false)
		router := getRouter(&API{JIRAConfigValues: JIRAConfig{TokenURL: &server.URL}})
		request, _ := http.NewRequest("GET", "/authorize/jira/callback/?code=123abc", nil)
		authToken := login("approved@generaltask.io")
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
		server := getTokenServerForJIRA(t, http.StatusOK, false)
		router := getRouter(&API{JIRAConfigValues: JIRAConfig{TokenURL: &server.URL}})
		request, _ := http.NewRequest("GET", "/authorize/jira/callback/?code=123abc", nil)
		authToken := login("approved@generaltask.io")
		request.AddCookie(&http.Cookie{Name: "authToken", Value: authToken})
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusFound, recorder.Code)

		db, dbCleanup := GetDBConnection()
		defer dbCleanup()
		internalAPITokenCollection := db.Collection("internal_api_tokens")
		var authTokenStruct InternalAPIToken
		err := internalAPITokenCollection.FindOne(nil, bson.D{{"token", authToken}}).Decode(&authTokenStruct)
		assert.NoError(t, err)
		externalAPITokenCollection := db.Collection("external_api_tokens")
		count, err := externalAPITokenCollection.CountDocuments(nil, bson.D{{"user_id", authTokenStruct.UserID}, {"source", "jira"}})
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)
		var jiraToken ExternalAPIToken
		err = externalAPITokenCollection.FindOne(nil, bson.D{{"user_id", authTokenStruct.UserID}, {"source", "jira"}}).Decode(&jiraToken)
		assert.NoError(t, err)
		assert.Equal(t, "jira", jiraToken.Source)
	})
}

func TestLoginRedirect(t *testing.T) {
	// Syntax taken from https://semaphoreci.com/community/tutorials/test-driven-development-of-go-web-applications-with-gin
	// Also inspired by https://dev.to/jacobsngoodwin/04-testing-first-gin-http-handler-9m0
	t.Run("Success", func(t *testing.T) {
		router := getRouter(&API{GoogleConfig: &oauthConfigWrapper{Config: &oauth2.Config{
			ClientID:    "123",
			RedirectURL: "g.com",
			Scopes:      []string{"s1", "s2"},
		}}})

		request, _ := http.NewRequest("GET", "/login/", nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusFound, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(
			t,
			"<a href=\"/login/?access_type=offline&amp;client_id=123&amp;prompt=consent&amp;redirect_uri=g.com&amp;response_type=code&amp;scope=s1+s2&amp;state=state-token\">Found</a>.\n\n",
			string(body),
		)
	})
}

func TestLoginCallback(t *testing.T) {
	t.Run("MissingQueryParams", func(t *testing.T) {
		router := getRouter(&API{})

		request, _ := http.NewRequest("GET", "/login/callback/", nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"Missing query params\"}", string(body))
	})

	t.Run("EmailNotApproved", func(t *testing.T) {
		recorder := makeLoginCallbackRequest("noice420", "unapproved@gmail.com")
		assert.Equal(t, http.StatusForbidden, recorder.Code)
	})

	t.Run("Success", func(t *testing.T) {
		db, dbCleanup := GetDBConnection()
		defer dbCleanup()
		recorder := makeLoginCallbackRequest("noice420", "approved@generaltask.io")
		assert.Equal(t, http.StatusFound, recorder.Code)
		verifyLoginCallback(t, db, "noice420")
		//change token and verify token updates and still only 1 row per user.
		recorder = makeLoginCallbackRequest("TSLA", "approved@generaltask.io")
		assert.Equal(t, http.StatusFound, recorder.Code)
		verifyLoginCallback(t, db, "TSLA")
	})
}

func TestCORSHeaders(t *testing.T) {
	t.Run("OPTIONS preflight request", func(t *testing.T) {
		router := getRouter(&API{})
		request, _ := http.NewRequest("OPTIONS", "/tasks/", nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)

		assert.Equal(t, http.StatusNoContent, recorder.Code)
		headers := recorder.Result().Header
		assert.Equal(t, "Authorization,Access-Control-Allow-Origin,Access-Control-Allow-Headers",
			headers.Get("Access-Control-Allow-Headers"))
		assert.Equal(t, "http://localhost:3000", headers.Get("Access-Control-Allow-Origin"))
		assert.Equal(t, "POST, OPTIONS, GET, PUT", headers.Get("Access-Control-Allow-Methods"))
	})
	t.Run("GET request", func(t *testing.T) {
		router := getRouter(&API{})
		request, _ := http.NewRequest("GET", "/ping/", nil)
		authToken := login("approved@generaltask.io")
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)

		assert.Equal(t, http.StatusOK, recorder.Code)
		headers := recorder.Result().Header
		assert.Equal(t, "Authorization,Access-Control-Allow-Origin,Access-Control-Allow-Headers",
			headers.Get("Access-Control-Allow-Headers"))
		assert.Equal(t, "http://localhost:3000", headers.Get("Access-Control-Allow-Origin"))
		assert.Equal(t, "POST, OPTIONS, GET, PUT", headers.Get("Access-Control-Allow-Methods"))
	})
}

func makeLoginCallbackRequest(googleToken string, email string) *httptest.ResponseRecorder {
	mockConfig := MockGoogleConfig{}
	mockToken := oauth2.Token{AccessToken: googleToken}
	mockConfig.On("Exchange", context.Background(), "code1234").Return(&mockToken, nil)
	mockClient := MockHTTPClient{}
	mockClient.On("Get", "https://www.googleapis.com/oauth2/v3/userinfo").Return(&http.Response{Body: ioutil.NopCloser(bytes.NewBufferString(fmt.Sprintf("{\"sub\": \"goog12345\", \"email\": \"%s\"}", email)))}, nil)
	mockConfig.On("Client", context.Background(), &mockToken).Return(&mockClient)
	router := getRouter(&API{GoogleConfig: &mockConfig})

	request, _ := http.NewRequest("GET", "/login/callback/", nil)
	queryParams := request.URL.Query()
	queryParams.Add("state", "example-state")
	queryParams.Add("code", "code1234")
	queryParams.Add("scope", "s1,s2")
	request.URL.RawQuery = queryParams.Encode()

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	return recorder
}

func verifyLoginCallback(t *testing.T, db *mongo.Database, authToken string) {
	userCollection := db.Collection("users")
	count, err := userCollection.CountDocuments(nil, bson.D{{"google_id", "goog12345"}})
	assert.NoError(t, err)
	assert.Equal(t, int64(1), count)
	var user User
	err = userCollection.FindOne(nil, bson.D{{"google_id", "goog12345"}}).Decode(&user)
	assert.NoError(t, err)

	externalAPITokenCollection := db.Collection("external_api_tokens")
	count, err = externalAPITokenCollection.CountDocuments(nil, bson.D{{"user_id", user.ID}, {"source", "google"}})
	assert.NoError(t, err)
	assert.Equal(t, int64(1), count)
	var googleToken ExternalAPIToken
	err = externalAPITokenCollection.FindOne(nil, bson.D{{"user_id", user.ID}, {"source", "google"}}).Decode(&googleToken)
	assert.NoError(t, err)
	assert.Equal(t, "google", googleToken.Source)
	expectedToken := fmt.Sprintf("{\"access_token\":\"%s\",\"expiry\":\"0001-01-01T00:00:00Z\"}", authToken)
	assert.Equal(t, expectedToken, googleToken.Token)
	assert.Equal(t, user.ID, googleToken.UserID)

	internalAPITokenCollection := db.Collection("internal_api_tokens")
	count, err = internalAPITokenCollection.CountDocuments(nil, bson.D{{"user_id", user.ID}})
	assert.NoError(t, err)
	assert.Equal(t, int64(1), count)
}

func TestAuthenticationMiddleware(t *testing.T) {
	authToken := login("approved@generaltask.io")

	t.Run("InvalidLength", func(t *testing.T) {
		recorder := runAuthenticatedEndpoint("Bearer hello")
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
		recorder = runAuthenticatedEndpoint("hello")
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
		recorder = runAuthenticatedEndpoint(authToken)
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"incorrect auth token format\"}", string(body))
	})

	t.Run("InvalidToken", func(t *testing.T) {
		recorder := runAuthenticatedEndpoint("Bearer c5b034f4-a645-4352-91d6-0c271afc4076")
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"unauthorized\"}", string(body))
	})

	t.Run("Valid", func(t *testing.T) {
		recorder := runAuthenticatedEndpoint("Bearer " + authToken)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "\"success\"", string(body))
	})
}

func TestLogout(t *testing.T) {

	t.Run("Logout", func(t *testing.T) {
		authToken := login("approved@generaltask.io")

		db, dbCleanup := GetDBConnection()
		defer dbCleanup()
		tokenCollection := db.Collection("internal_api_tokens")

		count, _ := tokenCollection.CountDocuments(nil, bson.D{{"token", authToken}})
		assert.Equal(t, int64(1), count)

		router := getRouter(&API{})

		request, _ := http.NewRequest("POST", "/logout/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		count, _ = tokenCollection.CountDocuments(nil, bson.D{{"token", authToken}})
		assert.Equal(t, int64(0), count)
	})

	t.Run("Unauthorized", func(t *testing.T) {
		router := getRouter(&API{})

		request, _ := http.NewRequest("POST", "/logout/", nil)
		request.Header.Add("Authorization", "Bearer c8db8f3c-6fa2-476c-9648-b31432dc3ff7")

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
	})

}

func login(email string) string {
	recorder := makeLoginCallbackRequest("googleToken", email)
	for _, c := range recorder.Result().Cookies() {
		if c.Name == "authToken" {
			return c.Value
		}
	}
	return ""
}

func runAuthenticatedEndpoint(attemptedHeader string) *httptest.ResponseRecorder {
	router := getRouter(&API{})

	request, _ := http.NewRequest("GET", "/ping/", nil)
	request.Header.Add("Authorization", attemptedHeader)

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	return recorder
}

func TestCalendar(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		standardEvent := calendar.Event{
			Created:        "2021-02-25T17:53:01.000Z",
			Summary:        "Standard Event",
			Start:          &calendar.EventDateTime{DateTime: "2021-03-06T15:00:00-05:00"},
			End:            &calendar.EventDateTime{DateTime: "2021-03-06T15:30:00-05:00"},
			HtmlLink:       "generaltask.io",
			Id:             "standard_event",
			ServerResponse: googleapi.ServerResponse{HTTPStatusCode: 0},
		}

		startTime, _ := time.Parse(time.RFC3339, "2021-03-06T15:00:00-05:00")
		endTime, _ := time.Parse(time.RFC3339, "2021-03-06T15:30:00-05:00")

		standardTask := CalendarEvent{
			TaskBase: TaskBase{
				IDOrdering: 0,
				IDExternal: "standard_event",
				Deeplink:   "generaltask.io",
				Title:      "Standard Event",
				Source:     TaskSourceGoogleCalendar.Name,
				Logo:       TaskSourceGoogleCalendar.Logo,
			},
			DatetimeStart: primitive.NewDateTimeFromTime(startTime),
			DatetimeEnd:   primitive.NewDateTimeFromTime(endTime),
		}

		autoEvent := calendar.Event{
			Created:        "2021-02-25T17:53:01.000Z",
			Summary:        "Auto Event (via Clockwise)",
			Start:          &calendar.EventDateTime{DateTime: "2021-03-06T15:00:00-05:00"},
			End:            &calendar.EventDateTime{DateTime: "2021-03-06T15:30:00-05:00"},
			HtmlLink:       "generaltask.io",
			Id:             "auto_event",
			ServerResponse: googleapi.ServerResponse{HTTPStatusCode: 0},
		}

		allDayEvent := calendar.Event{
			Created:        "2021-02-25T17:53:01.000Z",
			Summary:        "All day Event",
			Start:          &calendar.EventDateTime{Date: "2021-03-06"},
			End:            &calendar.EventDateTime{Date: "2021-03-06"},
			HtmlLink:       "generaltask.io",
			Id:             "all_day_event",
			ServerResponse: googleapi.ServerResponse{HTTPStatusCode: 0},
		}

		server := getServerForTasks([]*calendar.Event{&standardEvent, &allDayEvent, &autoEvent})
		defer server.Close()
		var calendarEvents = make(chan []*CalendarEvent)
		go loadCalendarEvents(nil, calendarEvents, &server.URL)
		result := <-calendarEvents
		assert.Equal(t, 1, len(result))
		firstTask := result[0]
		assertCalendarEventsEqual(t, &standardTask, firstTask)

		db, dbCleanup := GetDBConnection()
		defer dbCleanup()
		taskCollection := db.Collection("tasks")

		var calendarEventFromDB CalendarEvent
		err := taskCollection.FindOne(nil, bson.D{{"source", TaskSourceGoogleCalendar.Name}, {"id_external", "standard_event"}}).Decode(&calendarEventFromDB)
		assert.NoError(t, err)
		assertCalendarEventsEqual(t, &standardTask, &calendarEventFromDB)
	})
	t.Run("EmptyResult", func(t *testing.T) {
		server := getServerForTasks([]*calendar.Event{})
		defer server.Close()
		var calendarEvents = make(chan []*CalendarEvent)
		go loadCalendarEvents(nil, calendarEvents, &server.URL)
		result := <-calendarEvents
		assert.Equal(t, 0, len(result))
	})
}

func TestLoadJIRATasks(t *testing.T) {
	db, dbCleanup := GetDBConnection()
	defer dbCleanup()
	externalAPITokenCollection := db.Collection("external_api_tokens")

	t.Run("MissingJIRAToken", func(t *testing.T) {
		var JIRATasks = make(chan []*Task)
		userID := primitive.NewObjectID()
		go loadJIRATasks(&API{}, externalAPITokenCollection, userID, JIRATasks)
		result := <-JIRATasks
		assert.Equal(t, 0, len(result))
	})
	t.Run("RefreshTokenFailed", func(t *testing.T) {
		userID := createJIRAToken(t, externalAPITokenCollection)
		tokenServer := getTokenServerForJIRA(t, http.StatusUnauthorized, true)
		var JIRATasks = make(chan []*Task)
		go loadJIRATasks(&API{JIRAConfigValues: JIRAConfig{TokenURL: &tokenServer.URL}}, externalAPITokenCollection, *userID, JIRATasks)
		result := <-JIRATasks
		assert.Equal(t, 0, len(result))
	})
	t.Run("CloudIDFetchFailed", func(t *testing.T) {
		userID := createJIRAToken(t, externalAPITokenCollection)
		cloudIDServer := getCloudIDServerForJIRA(t, http.StatusUnauthorized, false)
		tokenServer := getTokenServerForJIRA(t, http.StatusOK, true)
		var JIRATasks = make(chan []*Task)
		go loadJIRATasks(&API{JIRAConfigValues: JIRAConfig{CloudIDURL: &cloudIDServer.URL, TokenURL: &tokenServer.URL}}, externalAPITokenCollection, *userID, JIRATasks)
		result := <-JIRATasks
		assert.Equal(t, 0, len(result))
	})
	t.Run("EmptyCloudIDResponse", func(t *testing.T) {
		userID := createJIRAToken(t, externalAPITokenCollection)
		cloudIDServer := getCloudIDServerForJIRA(t, http.StatusOK, true)
		tokenServer := getTokenServerForJIRA(t, http.StatusOK, true)
		var JIRATasks = make(chan []*Task)
		go loadJIRATasks(&API{JIRAConfigValues: JIRAConfig{CloudIDURL: &cloudIDServer.URL, TokenURL: &tokenServer.URL}}, externalAPITokenCollection, *userID, JIRATasks)
		result := <-JIRATasks
		assert.Equal(t, 0, len(result))
	})
	t.Run("SearchFailed", func(t *testing.T) {
		userID := createJIRAToken(t, externalAPITokenCollection)
		cloudIDServer := getCloudIDServerForJIRA(t, http.StatusOK, false)
		tokenServer := getTokenServerForJIRA(t, http.StatusOK, true)
		searchServer := getSearchServerForJIRA(t, http.StatusUnauthorized, false)
		var JIRATasks = make(chan []*Task)
		go loadJIRATasks(&API{JIRAConfigValues: JIRAConfig{APIBaseURL: &searchServer.URL, CloudIDURL: &cloudIDServer.URL, TokenURL: &tokenServer.URL}}, externalAPITokenCollection, *userID, JIRATasks)
		result := <-JIRATasks
		assert.Equal(t, 0, len(result))
	})
	t.Run("EmptySearchResponse", func(t *testing.T) {
		userID := createJIRAToken(t, externalAPITokenCollection)
		cloudIDServer := getCloudIDServerForJIRA(t, http.StatusOK, false)
		tokenServer := getTokenServerForJIRA(t, http.StatusOK, true)
		searchServer := getSearchServerForJIRA(t, http.StatusOK, true)
		var JIRATasks = make(chan []*Task)
		go loadJIRATasks(&API{JIRAConfigValues: JIRAConfig{APIBaseURL: &searchServer.URL, CloudIDURL: &cloudIDServer.URL, TokenURL: &tokenServer.URL}}, externalAPITokenCollection, *userID, JIRATasks)
		result := <-JIRATasks
		assert.Equal(t, 0, len(result))
	})
	t.Run("Success", func(t *testing.T) {
		userID := createJIRAToken(t, externalAPITokenCollection)
		cloudIDServer := getCloudIDServerForJIRA(t, http.StatusOK, false)
		tokenServer := getTokenServerForJIRA(t, http.StatusOK, true)
		searchServer := getSearchServerForJIRA(t, http.StatusOK, false)
		var JIRATasks = make(chan []*Task)
		go loadJIRATasks(&API{JIRAConfigValues: JIRAConfig{APIBaseURL: &searchServer.URL, CloudIDURL: &cloudIDServer.URL, TokenURL: &tokenServer.URL}}, externalAPITokenCollection, *userID, JIRATasks)
		result := <-JIRATasks
		assert.Equal(t, 1, len(result))

		dueDate, _ := time.Parse("2006-01-02", "2021-04-20")
		expectedTask := Task{
			TaskBase: TaskBase{
				IDOrdering: 0,
				IDExternal: "42069",
				Deeplink:   "https://dankmemes.com/browse/MOON-1969",
				Title:      "Sample Taskeroni",
				Source:     TaskSourceJIRA.Name,
				Logo:       TaskSourceJIRA.Logo,
			},
			DueDate: primitive.NewDateTimeFromTime(dueDate),
		}
		assertTasksEqual(t, &expectedTask, result[0])

		db, dbCleanup := GetDBConnection()
		defer dbCleanup()
		taskCollection := db.Collection("tasks")

		var taskFromDB Task
		err := taskCollection.FindOne(nil, bson.D{{"source", TaskSourceJIRA.Name}, {"id_external", "42069"}}).Decode(&taskFromDB)
		assert.NoError(t, err)
		assertTasksEqual(t, &expectedTask, &taskFromDB)
	})
}

func createJIRAToken(t *testing.T, externalAPITokenCollection *mongo.Collection) *primitive.ObjectID {
	userID := primitive.NewObjectID()
	_, err := externalAPITokenCollection.InsertOne(
		context.Background(),
		&ExternalAPIToken{
			Source: "jira",
			Token:  `{"access_token":"sample-token","refresh_token":"sample-token","scope":"sample-scope","expires_in":3600,"token_type":"Bearer"}`,
			UserID: userID,
		},
	)
	assert.NoError(t, err)
	return &userID
}

func getTokenServerForJIRA(t *testing.T, statusCode int, refresh bool) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, err := ioutil.ReadAll(r.Body)
		assert.NoError(t, err)
		if refresh {
			assert.Equal(t, "{\"grant_type\": \"refresh_token\",\"client_id\": \"7sW3nPubP5vLDktjR2pfAU8cR67906X0\",\"client_secret\": \"u3kul-2ZWQP6j_Ial54AGxSWSxyW1uKe2CzlQ64FFe_cTc8GCbCBtFOSFZZhh-Wc\",\"refresh_token\": \"sample-token\"}", string(body))
		} else {
			assert.Equal(t, "{\"grant_type\": \"authorization_code\",\"client_id\": \"7sW3nPubP5vLDktjR2pfAU8cR67906X0\",\"client_secret\": \"u3kul-2ZWQP6j_Ial54AGxSWSxyW1uKe2CzlQ64FFe_cTc8GCbCBtFOSFZZhh-Wc\",\"code\": \"123abc\",\"redirect_uri\": \"https://api.generaltask.io/authorize2/jira/callback/\"}", string(body))
		}
		w.WriteHeader(statusCode)
		w.Write([]byte(`{"access_token":"sample-access-token","refresh_token":"sample-refresh-token","scope":"sample-scope","expires_in":3600,"token_type":"Bearer"}`))
	}))
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

func getServerForTasks(events []*calendar.Event) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		resp := &calendar.Events{
			Items:          events,
			ServerResponse: googleapi.ServerResponse{HTTPStatusCode: 200},
		}

		b, err := json.Marshal(resp)
		if err != nil {
			http.Error(w, "unable to marshal request: "+err.Error(), http.StatusBadRequest)
			return
		}
		w.Write(b)
	}))
}

func assertCalendarEventsEqual(t *testing.T, a *CalendarEvent, b *CalendarEvent) {
	assert.Equal(t, a.DatetimeStart, b.DatetimeStart)
	assert.Equal(t, a.DatetimeEnd, b.DatetimeEnd)
	assert.Equal(t, a.Deeplink, b.Deeplink)
	assert.Equal(t, a.IDExternal, b.IDExternal)
	assert.Equal(t, a.IDOrdering, b.IDOrdering)
	assert.Equal(t, a.Logo, b.Logo)
	assert.Equal(t, a.Title, b.Title)
	assert.Equal(t, a.Source, b.Source)
}

func assertTasksEqual(t *testing.T, a *Task, b *Task) {
	assert.Equal(t, a.Deeplink, b.Deeplink)
	assert.Equal(t, a.IDExternal, b.IDExternal)
	assert.Equal(t, a.IDOrdering, b.IDOrdering)
	assert.Equal(t, a.Logo, b.Logo)
	assert.Equal(t, a.Title, b.Title)
	assert.Equal(t, a.Source, b.Source)
}


func TestMergeTasks(t *testing.T) {
	t.Run("SimpleMerge", func(t *testing.T) {
		c1 := CalendarEvent{
			TaskBase: TaskBase{
				IDOrdering: 0,
				IDExternal: "standard_event",
				Deeplink:   "generaltask.io",
				Title:      "Standard Event",
				Source:     TaskSourceGoogleCalendar.Name,
				Logo:       TaskSourceGoogleCalendar.Logo,
			},
			DatetimeStart: primitive.NewDateTimeFromTime(time.Now().Add(time.Hour + time.Minute)),
			DatetimeEnd:   primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 2)),
		}

		c2 := CalendarEvent{
			TaskBase: TaskBase{
				IDOrdering: 0,
				IDExternal: "standard_event_2",
				Deeplink:   "generaltask.io",
				Title:      "Standard Event_2",
				Source:     TaskSourceGoogleCalendar.Name,
				Logo:       TaskSourceGoogleCalendar.Logo,
			},
			DatetimeStart: primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 3 + time.Minute * 20)),
			DatetimeEnd:   primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 4)),
		}

		e1 := Email{
			TaskBase: TaskBase{
				IDOrdering: 0,
				IDExternal: "sample_email",
				Deeplink:   "generaltask.io",
				Title:      "Respond to this email",
				Source:     TaskSourceGmail.Name,
				Logo:       TaskSourceGmail.Logo,
				TimeAllocation: (time.Minute * 5).Nanoseconds(),
			},
			SenderDomain: "gmail.com",
			TimeSent:     primitive.NewDateTimeFromTime(time.Now().Add(-time.Hour)),
		}

		e2 := Email{
			TaskBase: TaskBase{
				IDOrdering: 0,
				IDExternal: "sample_email_2",
				Deeplink:   "generaltask.io",
				Title:      "Respond to this email...eventually",
				Source:     TaskSourceGmail.Name,
				Logo:       TaskSourceGmail.Logo,
				TimeAllocation: (time.Minute * 2).Nanoseconds(),
			},
			SenderDomain: "yahoo.com",
			TimeSent:     primitive.NewDateTimeFromTime(time.Now().Add(-time.Hour)),
		}

		t1 := Task{
			TaskBase: TaskBase{
				IDOrdering: 0,
				IDExternal: "sample_task",
				Deeplink:   "generaltask.io",
				Title:      "Code x",
				Source:     TaskSourceJIRA.Name,
				Logo:       TaskSourceJIRA.Logo,
				TimeAllocation: (time.Hour).Nanoseconds(),
			},
			DueDate:    primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24)),
			Priority:   1,
			TaskNumber: 2,
		}

		t2 := Task{
			TaskBase: TaskBase{
				IDOrdering: 0,
				IDExternal: "sample_task",
				Deeplink:   "generaltask.io",
				Title:      "Code x",
				Source:     TaskSourceJIRA.Name,
				Logo:       TaskSourceJIRA.Logo,
				TimeAllocation: (time.Hour).Nanoseconds(),
			},
			DueDate:    primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 8)),
			Priority:   3,
			TaskNumber: 12,
		}

		t3 := Task{
			TaskBase: TaskBase{
				IDOrdering: 0,
				IDExternal: "sample_task",
				Deeplink:   "generaltask.io",
				Title:      "Code x",
				Source:     TaskSourceJIRA.Name,
				Logo:       TaskSourceJIRA.Logo,
				TimeAllocation: (time.Hour).Nanoseconds(),
			},
			DueDate:    primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 9)),
			Priority:   5,
			TaskNumber: 7,
		}

		t4 := Task{
			TaskBase: TaskBase{
				IDOrdering: 0,
				IDExternal: "sample_task",
				Deeplink:   "generaltask.io",
				Title:      "Code x",
				Source:     TaskSourceJIRA.Name,
				Logo:       TaskSourceJIRA.Logo,
				TimeAllocation: (time.Hour).Nanoseconds(),
			},
			DueDate:    primitive.NewDateTimeFromTime(time.Now().Add(time.Hour * 24 * 9)),
			Priority:   3,
			TaskNumber: 1,
		}


		result := mergeTasks(
			[]*CalendarEvent{&c1, &c2},
			[]*Email{&e1, &e2},
			[]*Task{&t1, &t2, &t3, &t4},
			"gmail.com")

		assert.Equal(t, len(result), 8)
	})
}

