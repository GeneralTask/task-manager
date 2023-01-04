package api

import (
	"bytes"
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/stretchr/testify/assert"
)

func TestUserInfo(t *testing.T) {
	accountID := "userinfo@generaltask.com"
	authToken := login(accountID, "")
	UnauthorizedTest(t, "GET", "/user_info/", nil)
	t.Run("SuccessGet", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()

		user := database.UserChangeable{
			Email:             accountID,
			Name:              "name",
			LinearName:        "linearName",
			LinearDisplayName: "linearDisplayName",
		}
		database.GetUserCollection(api.DB).FindOneAndUpdate(
			context.Background(),
			bson.M{"email": accountID},
			bson.M{"$set": user},
			options.FindOneAndUpdate().SetUpsert(true).SetReturnDocument(options.After),
		)

		router := GetRouter(api)
		request, _ := http.NewRequest("GET", "/user_info/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, `{"agreed_to_terms":false,"opted_into_marketing":false,"name":"name","is_employee":true,"email":"userinfo@generaltask.com","linear_name":"linearName","linear_display_name":"linearDisplayName"}`, string(body))
	})
	authToken = login("userinfo2@generaltask.com", "")
	t.Run("SuccessNonEmployee", func(t *testing.T) {
		nonEmployeeAuthToken := login("userinfo@gmail.com", "")
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest("GET", "/user_info/", nil)
		request.Header.Add("Authorization", "Bearer "+nonEmployeeAuthToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"agreed_to_terms\":false,\"opted_into_marketing\":false,\"name\":\"\",\"is_employee\":false,\"email\":\"userinfo@gmail.com\"}", string(body))
	})
	UnauthorizedTest(t, "PATCH", "/user_info/", nil)
	t.Run("EmptyPayload", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest("PATCH", "/user_info/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"invalid or missing parameters.\"}", string(body))
	})
	t.Run("BadPayload", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest(
			"PATCH",
			"/user_info/",
			bytes.NewBuffer([]byte(`{"agreed_to_terms": "absolutely not"}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"invalid or missing parameters.\"}", string(body))
	})
	t.Run("SuccessUpdate", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest(
			"PATCH",
			"/user_info/",
			bytes.NewBuffer([]byte(`{"agreed_to_terms":true,"opted_into_marketing":true}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{}", string(body))

		// fetch API again to verify values changed
		request, _ = http.NewRequest("GET", "/user_info/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder = httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err = io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"agreed_to_terms\":true,\"opted_into_marketing\":true,\"name\":\"\",\"is_employee\":true,\"email\":\"userinfo2@generaltask.com\"}", string(body))
	})
	t.Run("SuccessPartialUpdate", func(t *testing.T) {
		// assuming the fields are still true as above
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest(
			"PATCH",
			"/user_info/",
			bytes.NewBuffer([]byte(`{"agreed_to_terms":true,"opted_into_marketing":false}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{}", string(body))

		// fetch API again to verify values changed
		request, _ = http.NewRequest("GET", "/user_info/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder = httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err = io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"agreed_to_terms\":true,\"opted_into_marketing\":false,\"name\":\"\",\"is_employee\":true,\"email\":\"userinfo2@generaltask.com\"}", string(body))
	})
}
