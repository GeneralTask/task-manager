package api

import (
	"bytes"
	"context"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
)

func TestWaitlistAdd(t *testing.T) {
	t.Run("EmptyPayload", func(t *testing.T) {
		router := GetRouter(&API{})
		request, _ := http.NewRequest("POST", "/waitlist/", nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"Invalid or missing 'email' parameter.\"}", string(body))
	})
	t.Run("MissingEmail", func(t *testing.T) {
		router := GetRouter(&API{})
		request, _ := http.NewRequest(
			"POST",
			"/waitlist/",
			bytes.NewBuffer([]byte(`{"foo": "bar"}`)))
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"Invalid or missing 'email' parameter.\"}", string(body))
	})
	t.Run("BadEmail", func(t *testing.T) {
		router := GetRouter(&API{})
		request, _ := http.NewRequest(
			"POST",
			"/waitlist/",
			bytes.NewBuffer([]byte(`{"email": "teslatothemoon"}`)))
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"Invalid email format.\"}", string(body))
	})
	t.Run("Success", func(t *testing.T) {
		sendWaitlistRequest(t, http.StatusCreated, "{}")
		sendWaitlistRequest(t, http.StatusFound, "{\"detail\":\"Email already exists in system\"}")

		db, dbCleanup := database.GetDBConnection()
		defer dbCleanup()
		waitlistCollection := db.Collection("waitlist")
		count, err := waitlistCollection.CountDocuments(
			context.TODO(),
			bson.M{"email": "elon@tesla.moon"},
		)
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)
		var entry database.WaitlistEntry
		err = waitlistCollection.FindOne(
			context.TODO(),
			bson.M{"email": "elon@tesla.moon"},
		).Decode(&entry)
		assert.NoError(t, err)
		assert.Equal(t, "elon@tesla.moon", entry.Email)
	})
}

func sendWaitlistRequest(t *testing.T, expectedCode int, expectedResponse string) {
	router := GetRouter(&API{})
	request, _ := http.NewRequest(
		"POST",
		"/waitlist/",
		bytes.NewBuffer([]byte(`{"email": "elOn@tEslA.mOoN"}`)))
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	assert.Equal(t, expectedCode, recorder.Code)
	body, err := ioutil.ReadAll(recorder.Body)
	assert.NoError(t, err)
	assert.Equal(t, expectedResponse, string(body))
}
