package api

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/testutils"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestOverviewSuggestions(t *testing.T) {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	router := GetRouter(api)

	UnauthorizedTest(t, "GET", "/overview/views/suggestion/", nil)
	t.Run("NonGeneralTaskAccess", func(t *testing.T) {
		authtoken := login("test_overview@notGeneralTask.com", "")
		request, _ := http.NewRequest("GET", "/overview/views/suggestion/", nil)
		request.Header.Set("Authorization", "Bearer "+authtoken)
		request.Header.Set("Timezone-Offset", "0")

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, `{"detail":"inaccessible"}`, string(body))
	})

	t.Run("InvalidResponse", func(t *testing.T) {
		server := testutils.GetMockAPIServer(t, http.StatusOK, `{"id": "1", "choices": [{"text": "1. Task Inbox: This is the reasoning"}]}`)
		api.ExternalConfig.OpenAIOverrideURL = server.URL

		authtoken := login("test_overview_suggestion_invalid@generaltask.com", "")
		request, _ := http.NewRequest("GET", "/overview/views/suggestion/", nil)
		request.Header.Set("Authorization", "Bearer "+authtoken)
		request.Header.Set("Timezone-Offset", "0")

		userCollection := database.GetUserCollection(api.DB)
		_, err := userCollection.UpdateOne(context.Background(), bson.M{"email": "test_overview_suggestion_invalid@generaltask.com"}, bson.M{"$set": bson.M{"gpt_suggestions_left": constants.MAX_OVERVIEW_SUGGESTION}})
		assert.NoError(t, err)

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusInternalServerError, recorder.Code)

		var resultUser *database.User
		err = userCollection.FindOne(context.Background(), bson.M{"email": "test_overview_suggestion_invalid@generaltask.com"}).Decode(&resultUser)
		assert.NoError(t, err)
		assert.Equal(t, constants.MAX_OVERVIEW_SUGGESTION-1, resultUser.GPTSuggestionsLeft)
	})

	t.Run("Success", func(t *testing.T) {
		server := testutils.GetMockAPIServer(t, http.StatusOK, `{"id": "1", "choices": [{"text": "1. Task Inbox: This is the reasoning\n2. Linear Issues: Reasoning 2\n3. Slack Messages: Reasoning 3"}]}`)
		api.ExternalConfig.OpenAIOverrideURL = server.URL

		authtoken := login("test_overview_suggestion@generaltask.com", "")
		request, _ := http.NewRequest("GET", "/overview/views/suggestion/", nil)
		request.Header.Set("Authorization", "Bearer "+authtoken)
		request.Header.Set("Timezone-Offset", "0")

		userCollection := database.GetUserCollection(api.DB)
		_, err := userCollection.UpdateOne(context.Background(), bson.M{"email": "test_overview_suggestion@generaltask.com"}, bson.M{"$set": bson.M{"gpt_suggestions_left": constants.MAX_OVERVIEW_SUGGESTION}})
		assert.NoError(t, err)

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		regex := `[{"id":"[a-z0-9]{24}","reasoning":"This is the reasoning"},{"id":"[a-z0-9]{24}","reasoning":"Reasoning 2"},{"id":"[a-z0-9]{24}","reasoning":"Reasoning 3"}]`
		assert.Regexp(t, regex, string(body))

		var resultUser *database.User
		err = userCollection.FindOne(context.Background(), bson.M{"email": "test_overview_suggestion@generaltask.com"}).Decode(&resultUser)
		assert.NoError(t, err)
		assert.Equal(t, constants.MAX_OVERVIEW_SUGGESTION-1, resultUser.GPTSuggestionsLeft)
	})
}

func TestOverviewRemaining(t *testing.T) {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	router := GetRouter(api)

	UnauthorizedTest(t, "GET", "/overview/views/suggestions_remaining/", nil)
	t.Run("Success", func(t *testing.T) {
		authtoken := login("suggest_remaining_success@generaltask.com", "")
		request, _ := http.NewRequest("GET", "/overview/views/suggestions_remaining/", nil)
		request.Header.Set("Authorization", "Bearer "+authtoken)
		request.Header.Set("Timezone-Offset", "0")

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, `3`, string(body))
	})

	t.Run("SuccessWithRefresh", func(t *testing.T) {
		authtoken := login("test_overview_suggestion_w_refresh@generaltask.com", "")
		request, _ := http.NewRequest("GET", "/overview/views/suggestions_remaining/", nil)
		request.Header.Set("Authorization", "Bearer "+authtoken)
		request.Header.Set("Timezone-Offset", "0")

		currentTime := time.Now()
		api.OverrideTime = &currentTime

		userCollection := database.GetUserCollection(api.DB)
		_, err := userCollection.UpdateOne(context.Background(), bson.M{"email": "test_overview_suggestion_w_refresh@generaltask.com"}, bson.M{"$set": bson.M{"gpt_suggestions_left": 0, "gpt_last_suggestion_time": primitive.NewDateTimeFromTime(currentTime)}})
		assert.NoError(t, err)

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, `0`, string(body))

		lastRefresh := currentTime.AddDate(0, 0, -3)
		_, err = userCollection.UpdateOne(context.Background(), bson.M{"email": "test_overview_suggestion_w_refresh@generaltask.com"}, bson.M{"$set": bson.M{"gpt_last_suggestion_time": primitive.NewDateTimeFromTime(lastRefresh)}})
		assert.NoError(t, err)

		recorder = httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err = io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, fmt.Sprint(constants.MAX_OVERVIEW_SUGGESTION), string(body))
	})
}

func TestSanitizeGPTString(t *testing.T) {
	t.Run("SuccessNoPunctuation", func(t *testing.T) {
		starter := "Hello World"
		output := sanitizeGPTString(starter)
		assert.Equal(t, starter, output)
	})
	t.Run("SuccessWithPunctuation", func(t *testing.T) {
		punctuationString := "!HELLO!@#"
		output := sanitizeGPTString(punctuationString)
		expected := "HELLO"
		assert.Equal(t, expected, output)
	})
}

func TestDecrementGPTRemainingByOne(t *testing.T) {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()

	userCollection := database.GetUserCollection(api.DB)
	mongoResult, err := userCollection.InsertOne(context.Background(), database.User{
		GPTSuggestionsLeft: 3,
	})
	assert.NoError(t, err)
	userID := mongoResult.InsertedID.(primitive.ObjectID)
	updateTime := time.Now()
	api.OverrideTime = &updateTime

	t.Run("Success", func(t *testing.T) {
		user := database.User{
			ID:                 userID,
			GPTSuggestionsLeft: 3,
		}

		err = api.decrementGPTRemainingByOne(&user, 0)
		assert.NoError(t, err)

		var resultUser *database.User
		err = userCollection.FindOne(context.Background(), bson.M{"_id": userID}).Decode(&resultUser)
		assert.NoError(t, err)
		assert.Equal(t, 2, resultUser.GPTSuggestionsLeft)
		assert.Equal(t, primitive.NewDateTimeFromTime(updateTime), resultUser.GPTLastSuggestionTime)
	})
}
