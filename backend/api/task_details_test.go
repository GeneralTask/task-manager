package api

import (
	"context"
	"fmt"
	"time"

	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/testutils"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)


func TestTaskDetails(t *testing.T) {
	authToken := login("test_task_details@generaltask.com", "")
	title := "title"

	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	taskCollection := database.GetTaskCollection(db)
	userID := getUserIDFromAuthToken(t, db, authToken)
	notSharedTask, err := database.GetOrCreateTask(
		db,
		userID,
		"123abc",
		"foobar_source",
		&database.Task{
			UserID:      userID,
			Title:      &title,
		},
	)
	assert.NoError(t, err)

	publicSharedAccess := database.SharedAccessPublic
	publicSharedTask, err := database.GetOrCreateTask(
		db,
		userID,
		"123abcdef",
		"foobar_source",
		&database.Task{
			UserID:      userID,
			Title:      &title,
			SharedUntil: *testutils.CreateDateTime("9999-01-01"),
			SharedAccess: &publicSharedAccess,
		},
	)
	assert.NoError(t, err)

	domainSharedAccess := database.SharedAccessDomain
	domainSharedTask, err := database.GetOrCreateTask(
		db,
		userID,
		"123abcdefg",
		"foobar_source",
		&database.Task{
			UserID:      userID,
			Title:      &title,
			SharedUntil: *testutils.CreateDateTime("9999-01-01"),
			SharedAccess: &domainSharedAccess,
		},
	)
	assert.NoError(t, err)


	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	router := GetRouter(api)

	t.Run("InvalidTaskID", func(t *testing.T) {
		request, _ := http.NewRequest(
			"GET",
			fmt.Sprintf("/tasks/detail/%s/", primitive.NewObjectID()),
			nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, 401, recorder.Code)
	})
	t.Run("TaskNotShared", func(t *testing.T) {
		request, _ := http.NewRequest(
			"GET",
			fmt.Sprintf("/tasks/detail/%s/", notSharedTask.ID.Hex()),
			nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, 401, recorder.Code)
	})
	t.Run("SuccessPublic", func(t *testing.T) {
		differentDomainUserToken := login("differentDomain@applesauce.com", "")
		ServeRequest(t, differentDomainUserToken, "GET", fmt.Sprintf("/tasks/detail/%s/", publicSharedTask.ID.Hex()), nil, 200, api)
	})
	t.Run("SuccessDomain", func(t *testing.T) {
		sameDomain := login("sameDomainDifferentUser@generaltask.com", "")
		ServeRequest(t, sameDomain, "GET", fmt.Sprintf("/tasks/detail/%s/", domainSharedTask.ID.Hex()), nil, 200, api)
	})
	t.Run("DifferentDomain", func(t *testing.T) {
		differentDomainUserToken := login("wrongDomain@applesauce.com", "")
		ServeRequest(t, differentDomainUserToken, "GET", fmt.Sprintf("/tasks/detail/%s/", domainSharedTask.ID.Hex()), nil, 404, api)
	})
	t.Run("TaskSharedUntilExpired", func(t *testing.T) {
		expiredTime := primitive.NewDateTimeFromTime(time.Now().Add(-1 * time.Hour))
		mongoResult, err := taskCollection.InsertOne(context.Background(), &database.Task{
			UserID:      userID,
			Title:      &title,
			SharedUntil: expiredTime,
			SharedAccess: &publicSharedAccess,
		})
		expiredTaskID := mongoResult.InsertedID.(primitive.ObjectID)

		assert.NoError(t, err)
		ServeRequest(t, authToken, "GET", fmt.Sprintf("/tasks/detail/%s/", expiredTaskID), nil, 404, api)
	})

}
