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
		server := getServerForJIRA(t, http.StatusUnauthorized, `{}`)
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
		server := getServerForJIRA(t, http.StatusOK, `{"access_token":"sample-token","refresh_token":"sample-token","scope":"sample-scope","expires_in":3600,"token_type":"Bearer"}`)
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

		standardTask := Task{
			IDOrdering:    0,
			IDExternal:    "standard_event",
			DatetimeStart: "2021-03-06T15:00:00-05:00",
			DatetimeEnd:   "2021-03-06T15:30:00-05:00",
			Deeplink:      "generaltask.io",
			Title:         "Standard Event",
			Source:        TaskSourceGoogleCalendar.Name,
			Logo:          TaskSourceGoogleCalendar.Logo,
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
		var calendarEvents = make(chan []*Task)
		go loadCalendarEvents(nil, calendarEvents, &server.URL)
		result := <-calendarEvents
		assert.Equal(t, 1, len(result))
		firstTask := result[0]
		assertTasksEqual(t, &standardTask, firstTask)
	})
	t.Run("EmptyResult", func(t *testing.T) {
		server := getServerForTasks([]*calendar.Event{})
		defer server.Close()
		var calendarEvents = make(chan []*Task)
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
		go loadJIRATasks(&API{}, externalAPITokenCollection, primitive.NewObjectID(), JIRATasks)
		result := <-JIRATasks
		assert.Equal(t, 0, len(result))
	})
	t.Run("RefreshTokenFailed", func(t *testing.T) {})
	t.Run("CloudIDFetchFailed", func(t *testing.T) {})
	t.Run("EmptyCloudIDResponse", func(t *testing.T) {})
	t.Run("SearchFailed", func(t *testing.T) {})
	t.Run("EmptySearchResponse", func(t *testing.T) {})
	t.Run("Success", func(t *testing.T) {})
}

func getServerForJIRA(t *testing.T, statusCode int, body string) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, err := ioutil.ReadAll(r.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"grant_type\": \"authorization_code\",\"client_id\": \"7sW3nPubP5vLDktjR2pfAU8cR67906X0\",\"client_secret\": \"u3kul-2ZWQP6j_Ial54AGxSWSxyW1uKe2CzlQ64FFe_cTc8GCbCBtFOSFZZhh-Wc\",\"code\": \"123abc\",\"redirect_uri\": \"https://api.generaltask.io/authorize2/jira/callback/\"}", string(body))
		w.WriteHeader(statusCode)
		w.Write([]byte(`{"access_token":"sample-token","refresh_token":"sample-token","scope":"sample-scope","expires_in":3600,"token_type":"Bearer"}`))
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

func assertTasksEqual(t *testing.T, a *Task, b *Task) {
	assert.Equal(t, a.DatetimeStart, b.DatetimeStart)
	assert.Equal(t, a.DatetimeEnd, a.DatetimeEnd)
	assert.Equal(t, a.IDExternal, b.IDExternal)
	assert.Equal(t, a.Logo, b.Logo)
	assert.Equal(t, a.Title, b.Title)
}
