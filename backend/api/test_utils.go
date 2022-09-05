package api

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/google/uuid"
	"github.com/rs/zerolog/log"

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
	parentCtx := context.Background()
	internalAPITokenCollection := database.GetInternalTokenCollection(db)
	var authTokenStruct database.InternalAPIToken
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err := internalAPITokenCollection.FindOne(dbCtx, bson.M{"token": authToken}).Decode(&authTokenStruct)
	assert.NoError(t, err)
	return authTokenStruct.UserID
}

func getGoogleTokenFromAuthToken(t *testing.T, db *mongo.Database, authToken string) *database.ExternalAPIToken {
	parentCtx := context.Background()
	userID := getUserIDFromAuthToken(t, db, authToken)
	externalAPITokenCollection := database.GetExternalTokenCollection(db)
	var externalAPITokenStruct database.ExternalAPIToken
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err := externalAPITokenCollection.FindOne(
		dbCtx,
		bson.M{"$and": []bson.M{
			{"user_id": userID},
			{"service_id": external.TASK_SERVICE_ID_GOOGLE},
		}},
	).Decode(&externalAPITokenStruct)
	assert.NoError(t, err)
	return &externalAPITokenStruct
}

func newStateToken(db *mongo.Database, authToken string, useDeeplink bool) (*string, error) {
	parentCtx := context.Background()
	var userID *primitive.ObjectID
	if authToken != "" {
		internalAPITokenCollection := database.GetInternalTokenCollection(db)
		var token database.InternalAPIToken
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err := internalAPITokenCollection.FindOne(dbCtx, bson.M{"token": authToken}).Decode(&token)
		if err != nil {
			log.Fatal().Msgf("Failed to find internal api token for test")
		}
		userID = &token.UserID
	}

	return database.CreateStateToken(db, userID, useDeeplink)
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
	mockConfig.On("Exchange", mock.Anything, "code1234").Return(&mockToken, nil)
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
	mockConfig.On("Client", mock.Anything, &mockToken).Return(&mockClient)
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
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
	parentCtx := context.Background()
	userCollection := database.GetUserCollection(db)
	googleID := "goog12345_" + email

	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	count, err := userCollection.CountDocuments(dbCtx, bson.M{"google_id": googleID})
	assert.NoError(t, err)
	assert.Equal(t, int64(1), count)
	var user database.User
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = userCollection.FindOne(dbCtx, bson.M{"google_id": googleID}).Decode(&user)
	assert.NoError(t, err)

	externalAPITokenCollection := database.GetExternalTokenCollection(db)
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	count, err = externalAPITokenCollection.CountDocuments(
		dbCtx,
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
		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = externalAPITokenCollection.FindOne(
			dbCtx,
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
		internalAPITokenCollection := database.GetInternalTokenCollection(db)
		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		count, err = internalAPITokenCollection.CountDocuments(dbCtx, bson.M{"user_id": user.ID})
		assert.NoError(t, err)
		assert.GreaterOrEqual(t, count, int64(1))
	}

	tasksCollection := database.GetTaskCollection(db)
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	count, err = tasksCollection.CountDocuments(dbCtx, bson.M{"user_id": user.ID})
	assert.NoError(t, err)
	assert.Equal(t, int64(3), count)
	for index, title := range constants.StarterTasks {
		var task database.Task
		err = tasksCollection.FindOne(dbCtx, bson.M{"user_id": user.ID, "id_ordering": index + 1}).Decode(&task)
		assert.NoError(t, err)
		assert.Equal(t, title, *task.Title)
	}
}

func runAuthenticatedEndpoint(attemptedHeader string) *httptest.ResponseRecorder {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	router := GetRouter(api)

	request, _ := http.NewRequest("GET", "/ping_authed/", nil)
	request.Header.Add("Authorization", attemptedHeader)

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	return recorder
}

func createRandomGTEmail() string {
	return fmt.Sprintf("%s@generaltask.com", uuid.New().String())
}

func ServeRequest(t *testing.T, authToken string, method string, url string, requestBody io.Reader, expectedReponseCode int, api *API) []byte {
	if api == nil {
		newApi, dbCleanup := GetAPIWithDBCleanup()
		api = newApi
		defer dbCleanup()
	}
	router := GetRouter(api)
	request, _ := http.NewRequest(method, url, requestBody)
	request.Header.Add("Authorization", "Bearer "+authToken)

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	assert.Equal(t, expectedReponseCode, recorder.Code)
	responseBody, err := ioutil.ReadAll(recorder.Body)
	assert.NoError(t, err)
	return responseBody
}

func UnauthorizedTest(t *testing.T, method string, url string, body io.Reader) bool {
	return t.Run("Unauthorized", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest(method, url, body)

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
	})
}
