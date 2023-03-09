package api

import (
	"context"
	"fmt"
	"time"

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

	publicSharedAccess := database.SharedAccessPublic
	domainSharedAccess := database.SharedAccessDomain

	// futureTime := primitive.NewDateTimeFromTime(time.Now().Add(1 * time.Hour))
	expiredTime := primitive.NewDateTimeFromTime(time.Now().Add(-1 * time.Hour))

	// Create a task that is not shared
	mongoResult, err := taskCollection.InsertOne(context.Background(), &database.Task{
		ID:     primitive.NewObjectID(),
		UserID: userID,
		Title:  &title,
	})
	assert.NoError(t, err)
	notSharedTaskID := mongoResult.InsertedID.(primitive.ObjectID).Hex()

	// Create a task that is shared with everyone
	mongoResult, err = taskCollection.InsertOne(context.Background(), &database.Task{
		UserID:       userID,
		Title:        &title,
		SharedUntil:  *testutils.CreateDateTime("9999-01-01"),
		SharedAccess: &publicSharedAccess,
	})
	assert.NoError(t, err)
	publicSharedTaskID := mongoResult.InsertedID.(primitive.ObjectID).Hex()

	// Create a task that is shared with everyone with same domain
	domainSharedTask, err := database.GetOrCreateTask(
		db,
		userID,
		"123abcdefg",
		"foobar_source",
		&database.Task{
			UserID:       userID,
			Title:        &title,
			SharedUntil:  *testutils.CreateDateTime("9999-01-01"),
			SharedAccess: &domainSharedAccess,
		},
	)
	assert.NoError(t, err)
	domainSharedTaskID := domainSharedTask.ID.Hex()

	// Create task with expired sharedUntil
	mongoResult, err = taskCollection.InsertOne(context.Background(), &database.Task{
		UserID:       userID,
		Title:        &title,
		SharedUntil:  expiredTime,
		SharedAccess: &publicSharedAccess,
	})
	assert.NoError(t, err)
	expiredTaskID := mongoResult.InsertedID.(primitive.ObjectID).Hex()

	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()

	t.Run("InvalidTaskID", func(t *testing.T) {
		ServeRequest(t, authToken, "GET", fmt.Sprintf("/tasks/detail/%s/", primitive.NewObjectID()), nil, 404, api)
	})
	t.Run("TaskNotShared", func(t *testing.T) {
		ServeRequest(t, authToken, "GET", fmt.Sprintf("/tasks/detail/%s/", notSharedTaskID), nil, 404, api)
	})
	t.Run("SuccessPublic", func(t *testing.T) {
		differentDomainUserToken := login("differentDomain@applesauce.com", "")
		ServeRequest(t, differentDomainUserToken, "GET", fmt.Sprintf("/tasks/detail/%s/", publicSharedTaskID), nil, 200, api)
	})
	t.Run("SuccessDomain", func(t *testing.T) {
		sameDomain := login("sameDomainDifferentUser@generaltask.com", "")
		ServeRequest(t, sameDomain, "GET", fmt.Sprintf("/tasks/detail/%s/", domainSharedTaskID), nil, 200, api)
	})
	t.Run("DifferentDomain", func(t *testing.T) {
		differentDomainUserToken := login("wrongDomain@applesauce.com", "")
		ServeRequest(t, differentDomainUserToken, "GET", fmt.Sprintf("/tasks/detail/%s/", domainSharedTaskID), nil, 404, api)
	})
	t.Run("TaskSharedTimeExpired", func(t *testing.T) {
		ServeRequest(t, authToken, "GET", fmt.Sprintf("/tasks/detail/%s/", expiredTaskID), nil, 404, api)
	})
}
