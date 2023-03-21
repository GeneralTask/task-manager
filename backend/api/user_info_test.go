package api

import (
	"bytes"
	"context"
	"net/http"
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
		responseBody := ServeRequest(t, authToken, "GET", "/user_info/", nil, http.StatusOK, api)
		assert.Equal(t, `{"agreed_to_terms":false,"opted_into_marketing":false,"business_mode_enabled":false,"name":"name","is_employee":true,"email":"userinfo@generaltask.com","is_company_email":true,"linear_name":"linearName","linear_display_name":"linearDisplayName"}`, string(responseBody))
	})
	authToken = login("userinfo2@generaltask.com", "")
	t.Run("SuccessNonEmployee", func(t *testing.T) {
		nonEmployeeAuthToken := login("userinfo@gmail.com", "")
		responseBody := ServeRequest(t, nonEmployeeAuthToken, "GET", "/user_info/", nil, http.StatusOK, nil)
		assert.Equal(t, "{\"agreed_to_terms\":false,\"opted_into_marketing\":false,\"business_mode_enabled\":false,\"name\":\"\",\"is_employee\":false,\"email\":\"userinfo@gmail.com\",\"is_company_email\":false}", string(responseBody))
	})
	UnauthorizedTest(t, "PATCH", "/user_info/", nil)
	t.Run("EmptyPayload", func(t *testing.T) {
		responseBody := ServeRequest(t, authToken, "PATCH", "/user_info/", nil, http.StatusBadRequest, nil)
		assert.Equal(t, "{\"detail\":\"invalid or missing parameters.\"}", string(responseBody))
	})
	t.Run("BadPayload", func(t *testing.T) {
		responseBody := ServeRequest(t, authToken, "PATCH", "/user_info/", bytes.NewBuffer([]byte(`{"agreed_to_terms": "absolutely not"}`)), http.StatusBadRequest, nil)
		assert.Equal(t, "{\"detail\":\"invalid or missing parameters.\"}", string(responseBody))
	})
	t.Run("SuccessUpdate", func(t *testing.T) {
		responseBody := ServeRequest(t, authToken, "PATCH", "/user_info/", bytes.NewBuffer([]byte(`{"agreed_to_terms":true,"opted_into_marketing":true,"business_mode_enabled":true}`)), http.StatusOK, nil)
		assert.Equal(t, "{}", string(responseBody))

		// fetch API again to verify values changed
		responseBody = ServeRequest(t, authToken, "GET", "/user_info/", nil, http.StatusOK, nil)
		assert.Equal(t, "{\"agreed_to_terms\":true,\"opted_into_marketing\":true,\"business_mode_enabled\":false,\"name\":\"\",\"is_employee\":true,\"email\":\"userinfo2@generaltask.com\",\"is_company_email\":true}", string(responseBody))
	})
	t.Run("SuccessPartialUpdate", func(t *testing.T) {
		// assuming the fields are still true as above
		responseBody := ServeRequest(t, authToken, "PATCH", "/user_info/", bytes.NewBuffer([]byte(`{"agreed_to_terms":true,"opted_into_marketing":false}`)), http.StatusOK, nil)
		assert.Equal(t, "{}", string(responseBody))

		// fetch API again to verify values changed
		responseBody = ServeRequest(t, authToken, "GET", "/user_info/", nil, http.StatusOK, nil)
		assert.Equal(t, "{\"agreed_to_terms\":true,\"opted_into_marketing\":false,\"business_mode_enabled\":false,\"name\":\"\",\"is_employee\":true,\"email\":\"userinfo2@generaltask.com\",\"is_company_email\":true}", string(responseBody))
	})
}
