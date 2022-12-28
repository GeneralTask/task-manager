package api

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type sectionCreateResponse struct {
	ID primitive.ObjectID `json:"id"`
}

func TestSections(t *testing.T) {
	authToken := login("test_sections@generaltask.com", "")
	createdTaskID := ""
	createdTaskID2 := ""
	UnauthorizedTest(t, "GET", "/sections/", nil)
	UnauthorizedTest(t, "POST", "/sections/create/", nil)
	UnauthorizedTest(t, "PATCH", "/sections/modify/123/", nil)
	UnauthorizedTest(t, "DELETE", "/sections/delete/123/", nil)
	t.Run("EmptyPayloadCreate", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest("POST", "/sections/create/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"invalid or missing 'name' parameter\"}", string(body))
	})
	t.Run("BadPayloadCreate", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest(
			"POST",
			"/sections/create/",
			bytes.NewBuffer([]byte(`{"name": true}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"invalid or missing 'name' parameter\"}", string(body))
	})
	t.Run("CreateSuccess", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest(
			"POST",
			"/sections/create/",
			bytes.NewBuffer([]byte(`{"name": "important videos"}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusCreated, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		responseObject := sectionCreateResponse{}
		err = json.Unmarshal(body, &responseObject)
		assert.NoError(t, err)
		section1ID := responseObject.ID
		// create a second one
		request, _ = http.NewRequest(
			"POST",
			"/sections/create/",
			bytes.NewBuffer([]byte(`{"name": "important videos 2", "id_ordering": 2}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusCreated, recorder.Code)
		body, err = io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		responseObject = sectionCreateResponse{}
		err = json.Unmarshal(body, &responseObject)
		assert.NoError(t, err)
		section2ID := responseObject.ID
		assert.NotEqual(t, section1ID, section2ID)
	})
	t.Run("SuccessGet", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest("GET", "/sections/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		var sectionResult []SectionResult
		err = json.Unmarshal(body, &sectionResult)
		assert.NoError(t, err)
		assert.Equal(t, 2, len(sectionResult))
		// should be in same order as created until ordering ID is set
		assert.Equal(t, "important videos", sectionResult[0].Name)
		assert.Equal(t, 0, sectionResult[0].IDOrdering)
		assert.Equal(t, "important videos 2", sectionResult[1].Name)
		assert.Equal(t, 2, sectionResult[1].IDOrdering)
		createdTaskID = sectionResult[0].ID.Hex()
		createdTaskID2 = sectionResult[1].ID.Hex()
	})
	t.Run("EmptyPayloadModify", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest("PATCH", "/sections/modify/"+createdTaskID+"/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"invalid or missing task section modify parameter\"}", string(body))
	})
	t.Run("BadPayloadModify", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest(
			"PATCH",
			"/sections/modify/"+createdTaskID+"/",
			bytes.NewBuffer([]byte(`{"name": true}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"invalid or missing task section modify parameter\"}", string(body))
	})
	t.Run("ModifyBadURL", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest(
			"PATCH",
			"/sections/modify/"+primitive.NewObjectID().Hex()+"/",
			bytes.NewBuffer([]byte(`{"name": "oh no"}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
	})
	t.Run("ModifySuccess", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest(
			"PATCH",
			"/sections/modify/"+createdTaskID+"/",
			bytes.NewBuffer([]byte(`{"name": "things i dont want to do", "id_ordering": 1}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{}", string(body))

		// make same request to verify updating with same name is ok
		request, _ = http.NewRequest(
			"PATCH",
			"/sections/modify/"+createdTaskID+"/",
			bytes.NewBuffer([]byte(`{"name": "things i dont want to do"}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder = httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err = io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{}", string(body))

		// update the other id ordering too, pushing the other one to spot 2
		request, _ = http.NewRequest(
			"PATCH",
			"/sections/modify/"+createdTaskID2+"/",
			bytes.NewBuffer([]byte(`{"id_ordering": 1}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder = httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err = io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{}", string(body))

		// use API to check updated, verify id_ordering sort is correct
		request, _ = http.NewRequest("GET", "/sections/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder = httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err = io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		var sectionResult []SectionResult
		err = json.Unmarshal(body, &sectionResult)
		assert.NoError(t, err)
		assert.Equal(t, 2, len(sectionResult))
		assert.Equal(t, "important videos 2", sectionResult[0].Name)
		assert.Equal(t, "things i dont want to do", sectionResult[1].Name)
	})
	t.Run("DeleteBadURL", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest(
			"DELETE",
			"/sections/delete/"+primitive.NewObjectID().Hex()+"/",
			nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
	})
	t.Run("DeleteSuccess", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest(
			"DELETE",
			"/sections/delete/"+createdTaskID+"/",
			nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{}", string(body))

		// use API to check updated
		request, _ = http.NewRequest("GET", "/sections/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder = httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err = io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		var sectionResult []SectionResult
		err = json.Unmarshal(body, &sectionResult)
		assert.NoError(t, err)
		// only one left now
		assert.Equal(t, 1, len(sectionResult))
	})
	t.Run("DeleteAndUpdateRecurringTaskTemplatesSuccess", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		userID := getUserIDFromAuthToken(t, api.DB, authToken)

		// create two sections
		sectionCollection := database.GetTaskSectionCollection(api.DB)
		res, err := sectionCollection.InsertOne(context.Background(), database.TaskSection{
			Name:   "Section 1",
			UserID: userID,
		})
		assert.NoError(t, err)
		section1ID := res.InsertedID.(primitive.ObjectID)
		res, err = sectionCollection.InsertOne(context.Background(), database.TaskSection{
			Name:   "Section 2",
			UserID: userID,
		})
		assert.NoError(t, err)
		section2ID := res.InsertedID.(primitive.ObjectID)

		// create recurring task templates
		recurringTaskTemplateCollection := database.GetRecurringTaskTemplateCollection(api.DB)
		createTemplate := func(sectionID primitive.ObjectID) primitive.ObjectID {
			res, err = recurringTaskTemplateCollection.InsertOne(context.Background(), database.RecurringTaskTemplate{
				UserID:        userID,
				IDTaskSection: sectionID,
			})
			assert.NoError(t, err)
			return res.InsertedID.(primitive.ObjectID)
		}
		template1ID := createTemplate(section1ID)
		template2ID := createTemplate(section1ID)
		template3ID := createTemplate(section2ID)
		template4ID := createTemplate(section2ID)

		// delete task section
		router := GetRouter(api)
		request, _ := http.NewRequest(
			"DELETE",
			"/sections/delete/"+section1ID.Hex()+"/",
			nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{}", string(body))

		// check that templates with id_task_section of the deleted section were reverted to the task inbox ID
		var template database.RecurringTaskTemplate
		checkTemplateSectionID := func(templateID primitive.ObjectID, sectionID primitive.ObjectID) {
			err = recurringTaskTemplateCollection.FindOne(context.Background(), bson.M{"_id": templateID}).Decode(&template)
			assert.NoError(t, err)
			assert.Equal(t, template.IDTaskSection, sectionID)
		}
		checkTemplateSectionID(template1ID, constants.IDTaskSectionDefault)
		checkTemplateSectionID(template2ID, constants.IDTaskSectionDefault)
		checkTemplateSectionID(template3ID, section2ID)
		checkTemplateSectionID(template4ID, section2ID)
	})
}
