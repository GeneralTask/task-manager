package api

import (
	"bytes"
	"context"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
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

func (m *MockGoogleConfig) Client(ctx context.Context, t *oauth2.Token) external.HTTPClient {
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

func login(email string, name string) string {
	recorder := makeLoginCallbackRequest("googleToken", email, name, "example-token", "example-token", true, false)
	for _, c := range recorder.Result().Cookies() {
		if c.Name == "authToken" {
			return c.Value
		}
	}
	return ""
}

func getUserIDFromAuthToken(t *testing.T, db *mongo.Database, authToken string) primitive.ObjectID {
	parent_ctx := context.Background()
	internalAPITokenCollection := db.Collection("internal_api_tokens")
	var authTokenStruct database.InternalAPIToken
	db_ctx, cancel := context.WithTimeout(parent_ctx, constants.DatabaseTimeout)
	defer cancel()
	err := internalAPITokenCollection.FindOne(db_ctx, bson.M{"token": authToken}).Decode(&authTokenStruct)
	assert.NoError(t, err)
	return authTokenStruct.UserID
}

func getGoogleTokenFromAuthToken(t *testing.T, db *mongo.Database, authToken string) *database.ExternalAPIToken {
	parent_ctx := context.Background()
	userID := getUserIDFromAuthToken(t, db, authToken)
	externalAPITokenCollection := db.Collection("external_api_tokens")
	var externalAPITokenStruct database.ExternalAPIToken
	db_ctx, cancel := context.WithTimeout(parent_ctx, constants.DatabaseTimeout)
	defer cancel()
	err := externalAPITokenCollection.FindOne(
		db_ctx,
		bson.M{"$and": []bson.M{
			{"user_id": userID},
			{"service_id": external.TASK_SERVICE_ID_GOOGLE},
		}},
	).Decode(&externalAPITokenStruct)
	assert.NoError(t, err)
	return &externalAPITokenStruct
}

func getGmailArchiveServer(t *testing.T, expectedLabel string) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, err := ioutil.ReadAll(r.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"removeLabelIds\":[\""+expectedLabel+"\"]}\n", string(body))
		w.WriteHeader(200)
		w.Write([]byte(`{}`))
	}))
}

func newStateToken(authToken string) (*string, error) {
	parent_ctx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return nil, err
	}
	defer dbCleanup()
	var userID *primitive.ObjectID
	if authToken != "" {
		internalAPITokenCollection := db.Collection("internal_api_tokens")
		var token database.InternalAPIToken
		db_ctx, cancel := context.WithTimeout(parent_ctx, constants.DatabaseTimeout)
		defer cancel()
		err := internalAPITokenCollection.FindOne(db_ctx, bson.M{"token": authToken}).Decode(&token)
		if err != nil {
			log.Fatalf("Failed to find internal api token for test")
		}
		userID = &token.UserID
	}

	return database.CreateStateToken(db, userID)
}

func makeLoginCallbackRequest(
	googleToken string,
	email string,
	name string,
	stateToken string,
	stateTokenCookie string,
	skipStateTokenCheck bool,
	skipRefreshToken bool,
) *httptest.ResponseRecorder {
	mockConfig := MockGoogleConfig{}
	mockToken := oauth2.Token{AccessToken: googleToken}
	if !skipRefreshToken {
		mockToken.RefreshToken = "test123"
	}
	mockConfig.On("Exchange", context.Background(), "code1234").Return(&mockToken, nil)
	mockClient := MockHTTPClient{}
	mockClient.On(
		"Get",
		"https://www.googleapis.com/oauth2/v3/userinfo",
	).Return(
		&http.Response{
			Body: ioutil.NopCloser(bytes.NewBufferString(fmt.Sprintf(
				"{\"sub\": \"goog12345_%s\", \"email\": \"%s\", \"name\": \"%s\"}",
				email,
				email,
				name,
			)))},
		nil,
	)
	mockConfig.On("Client", context.Background(), &mockToken).Return(&mockClient)
	api := GetAPI()
	api.ExternalConfig.GoogleLoginConfig = &mockConfig
	api.SkipStateTokenCheck = skipStateTokenCheck
	router := GetRouter(api)

	request, _ := http.NewRequest("GET", "/login/callback/", nil)
	request.AddCookie(&http.Cookie{Name: "loginStateToken", Value: stateTokenCookie})
	queryParams := request.URL.Query()
	queryParams.Add("state", stateToken)
	queryParams.Add("code", "code1234")
	queryParams.Add("scope", "s1,s2")
	request.URL.RawQuery = queryParams.Encode()

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	return recorder
}

func verifyLoginCallback(t *testing.T, db *mongo.Database, email string, authToken string, assertNoExternalTokens bool, assertInternalToken bool) {
	parent_ctx := context.Background()
	userCollection := db.Collection("users")
	googleID := "goog12345_" + email

	db_ctx, cancel := context.WithTimeout(parent_ctx, constants.DatabaseTimeout)
	defer cancel()
	count, err := userCollection.CountDocuments(db_ctx, bson.M{"google_id": googleID})
	assert.NoError(t, err)
	assert.Equal(t, int64(1), count)
	var user database.User
	db_ctx, cancel = context.WithTimeout(parent_ctx, constants.DatabaseTimeout)
	defer cancel()
	err = userCollection.FindOne(db_ctx, bson.M{"google_id": googleID}).Decode(&user)
	assert.NoError(t, err)

	externalAPITokenCollection := db.Collection("external_api_tokens")
	db_ctx, cancel = context.WithTimeout(parent_ctx, constants.DatabaseTimeout)
	defer cancel()
	count, err = externalAPITokenCollection.CountDocuments(
		db_ctx,
		bson.M{"$and": []bson.M{
			{"user_id": user.ID},
			{"service_id": external.TASK_SERVICE_ID_GOOGLE},
			{"account_id": email},
		}},
	)
	assert.NoError(t, err)
	if assertNoExternalTokens {
		assert.Equal(t, int64(0), count)
	} else {
		assert.Equal(t, int64(1), count)
		var googleToken database.ExternalAPIToken
		db_ctx, cancel = context.WithTimeout(parent_ctx, constants.DatabaseTimeout)
		defer cancel()
		err = externalAPITokenCollection.FindOne(
			db_ctx,
			bson.M{"$and": []bson.M{
				{"user_id": user.ID},
				{"service_id": external.TASK_SERVICE_ID_GOOGLE},
			}},
		).Decode(&googleToken)
		assert.NoError(t, err)
		assert.Equal(t, external.TASK_SERVICE_ID_GOOGLE, googleToken.ServiceID)
		assert.Equal(t, email, googleToken.AccountID)
		assert.Equal(t, email, googleToken.DisplayID)
		expectedToken := fmt.Sprintf("{\"access_token\":\"%s\",\"refresh_token\":\"test123\",\"expiry\":\"0001-01-01T00:00:00Z\"}", authToken)
		assert.Equal(t, expectedToken, googleToken.Token)
		assert.Equal(t, user.ID, googleToken.UserID)
	}

	if assertInternalToken {
		internalAPITokenCollection := db.Collection("internal_api_tokens")
		db_ctx, cancel = context.WithTimeout(parent_ctx, constants.DatabaseTimeout)
		defer cancel()
		count, err = internalAPITokenCollection.CountDocuments(db_ctx, bson.M{"user_id": user.ID})
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)
	}
}

func runAuthenticatedEndpoint(attemptedHeader string) *httptest.ResponseRecorder {
	router := GetRouter(GetAPI())

	request, _ := http.NewRequest("GET", "/ping/", nil)
	request.Header.Add("Authorization", attemptedHeader)

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	return recorder
}
