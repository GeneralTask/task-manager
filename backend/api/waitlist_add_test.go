package api

import (
	"bytes"
	"context"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
)

func TestWaitlistAdd(t *testing.T) {
	parentCtx := context.Background()
	t.Run("EmptyPayload", func(t *testing.T) {
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("POST", "/waitlist/", nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"invalid or missing 'emailResponse' parameter.\"}", string(body))
	})
	t.Run("MissingEmail", func(t *testing.T) {
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest(
			"POST",
			"/waitlist/",
			bytes.NewBuffer([]byte(`{"foo": "bar"}`)))
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"invalid or missing 'emailResponse' parameter.\"}", string(body))
	})
	t.Run("BadEmail", func(t *testing.T) {
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest(
			"POST",
			"/waitlist/",
			bytes.NewBuffer([]byte(`{"emailResponse": "teslatothemoon"}`)))
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"invalid emailResponse format.\"}", string(body))
	})
	t.Run("Success", func(t *testing.T) {
		sendWaitlistRequest(t, http.StatusCreated, "{}")
		sendWaitlistRequest(t, http.StatusFound, "{\"detail\":\"emailResponse already exists in system\"}")

		db, dbCleanup, err := database.GetDBConnection()
		assert.NoError(t, err)
		defer dbCleanup()
		waitlistCollection := database.GetWaitlistCollection(db)
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		count, err := waitlistCollection.CountDocuments(
			dbCtx,
			bson.M{"emailResponse": "elon@tesla.moon"},
		)
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)
		var entry database.WaitlistEntry
		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = waitlistCollection.FindOne(
			dbCtx,
			bson.M{"emailResponse": "elon@tesla.moon"},
		).Decode(&entry)
		assert.NoError(t, err)
		assert.Equal(t, "elon@tesla.moon", entry.Email)
		assert.False(t, entry.HasAccess)
	})
}

func sendWaitlistRequest(t *testing.T, expectedCode int, expectedResponse string) {
	router := GetRouter(GetAPI())
	request, _ := http.NewRequest(
		"POST",
		"/waitlist/",
		bytes.NewBuffer([]byte(`{"emailResponse": "elOn@tEslA.mOoN"}`)))
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	assert.Equal(t, expectedCode, recorder.Code)
	body, err := ioutil.ReadAll(recorder.Body)
	assert.NoError(t, err)
	assert.Equal(t, expectedResponse, string(body))
}
