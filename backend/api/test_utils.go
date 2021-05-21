package api

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/oauth2"
	"google.golang.org/api/calendar/v3"
	"google.golang.org/api/googleapi"
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

func login(email string) string {
	recorder := makeLoginCallbackRequest("googleToken", email, "example-token", "example-token", true)
	for _, c := range recorder.Result().Cookies() {
		if c.Name == "authToken" {
			return c.Value
		}
	}
	return ""
}

func newStateToken(authToken string) string {
	db, dbCleanup := database.GetDBConnection()
	defer dbCleanup()
	var userID *primitive.ObjectID
	if authToken != "" {
		internalAPITokenCollection := db.Collection("internal_api_tokens")
		var token database.InternalAPIToken
		err := internalAPITokenCollection.FindOne(context.TODO(), bson.D{{Key: "token", Value: authToken}}).Decode(&token)
		if err != nil {
			log.Fatalf("Failed to find internal api token for test")
		}
		userID = &token.UserID
	}

	return database.CreateStateToken(db, userID)
}

func makeLoginCallbackRequest(googleToken string, email string, stateToken string, stateTokenCookie string, skipStateTokenCheck bool) *httptest.ResponseRecorder {
	mockConfig := MockGoogleConfig{}
	mockToken := oauth2.Token{AccessToken: googleToken}
	mockConfig.On("Exchange", context.Background(), "code1234").Return(&mockToken, nil)
	mockClient := MockHTTPClient{}
	mockClient.On("Get", "https://www.googleapis.com/oauth2/v3/userinfo").Return(&http.Response{Body: ioutil.NopCloser(bytes.NewBufferString(fmt.Sprintf("{\"sub\": \"goog12345_%s\", \"email\": \"%s\"}", email, email)))}, nil)
	mockConfig.On("Client", context.Background(), &mockToken).Return(&mockClient)
	router := GetRouter(&API{GoogleConfig: &mockConfig, SkipStateTokenCheck: skipStateTokenCheck})

	request, _ := http.NewRequest("GET", "/login/callback/", nil)
	request.AddCookie(&http.Cookie{Name: "googleStateToken", Value: stateTokenCookie})
	queryParams := request.URL.Query()
	queryParams.Add("state", stateToken)
	queryParams.Add("code", "code1234")
	queryParams.Add("scope", "s1,s2")
	request.URL.RawQuery = queryParams.Encode()

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	return recorder
}

func verifyLoginCallback(t *testing.T, db *mongo.Database, authToken string) {
	userCollection := db.Collection("users")
	count, err := userCollection.CountDocuments(context.TODO(), bson.D{{Key: "google_id", Value: "goog12345"}})
	assert.NoError(t, err)
	assert.Equal(t, int64(1), count)
	var user database.User
	err = userCollection.FindOne(context.TODO(), bson.D{{Key: "google_id", Value: "goog12345"}}).Decode(&user)
	assert.NoError(t, err)

	externalAPITokenCollection := db.Collection("external_api_tokens")
	count, err = externalAPITokenCollection.CountDocuments(context.TODO(), bson.D{{Key: "user_id", Value: user.ID}, {Key: "source", Value: "google"}})
	assert.NoError(t, err)
	assert.Equal(t, int64(1), count)
	var googleToken database.ExternalAPIToken
	err = externalAPITokenCollection.FindOne(context.TODO(), bson.D{{Key: "user_id", Value: user.ID}, {Key: "source", Value: "google"}}).Decode(&googleToken)
	assert.NoError(t, err)
	assert.Equal(t, "google", googleToken.Source)
	expectedToken := fmt.Sprintf("{\"access_token\":\"%s\",\"expiry\":\"0001-01-01T00:00:00Z\"}", authToken)
	assert.Equal(t, expectedToken, googleToken.Token)
	assert.Equal(t, user.ID, googleToken.UserID)

	internalAPITokenCollection := db.Collection("internal_api_tokens")
	count, err = internalAPITokenCollection.CountDocuments(context.TODO(), bson.D{{Key: "user_id", Value: user.ID}})
	assert.NoError(t, err)
	assert.Equal(t, int64(1), count)
}

func runAuthenticatedEndpoint(attemptedHeader string) *httptest.ResponseRecorder {
	router := GetRouter(&API{})

	request, _ := http.NewRequest("GET", "/ping/", nil)
	request.Header.Add("Authorization", attemptedHeader)

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	return recorder
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
