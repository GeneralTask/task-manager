package api

import (
	"bytes"
	"context"
	"encoding/json"
	"io/ioutil"
	"os"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/rs/zerolog/log"
	"go.mongodb.org/mongo-driver/bson"

	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCreateTestUser(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()

	t.Run("SucceedsInDev", func(t *testing.T) {
		env := os.Getenv("ENVIRONMENT")
		os.Setenv("ENVIRONMENT", "dev")
		defer os.Setenv("ENVIRONMENT", env)

		email := createRandomGTEmail()
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest(
			"POST",
			"/create_test_user/",
			bytes.NewBuffer([]byte(`{"email": "`+email+`", "name": "Test User"}`)))

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusCreated, recorder.Code)

		var result map[string]interface{}

		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		err = json.Unmarshal(body, &result)
		assert.NoError(t, err)

		log.Error().Err(err).Msgf("%+v", result["token"])

		var userObject database.User
		err = database.GetUserCollection(db).FindOne(dbCtx, bson.M{"email": email}).Decode(&userObject)
		assert.NoError(t, err)

		tokenCollection := database.GetInternalTokenCollection(db)
		count, _ := tokenCollection.CountDocuments(dbCtx, bson.M{"token": result["token"], "user_id": userObject.ID})
		assert.Equal(t, int64(1), count)
	})

	t.Run("FailsInProd", func(t *testing.T) {
		// Note since tests are run concurrently across packages, setting an envar like this could have interaction with other test
		env := os.Getenv("ENVIRONMENT")
		os.Setenv("ENVIRONMENT", "prod")
		defer os.Setenv("ENVIRONMENT", env)

		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest(
			"POST",
			"/create_test_user/",
			bytes.NewBuffer([]byte(`{"email": "test@generaltask.com", "name": "Test User"}`)))

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
	})

}
