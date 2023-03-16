package api

import (
	"fmt"
	"net/http"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/testutils"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)


func TestShareableTaskPreview(t *testing.T) {
	authToken := login("test_shareable_task_preview@generaltask.com", "")
	title1 := "shared"
	title2 := "not shared"

	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := getUserIDFromAuthToken(t, db, authToken)
	task1, err := database.GetOrCreateTask(
		db,
		userID,
		"123abc",
		"foobar_source",
		&database.Task{
			UserID: 	userID,
			Title: 		&title1,
			SharedUntil: *testutils.CreateDateTime("9999-01-01"),
		},
	)
	assert.NoError(t, err)
	task2, err := database.GetOrCreateTask(
		db,
		userID,
		"123abcdef",
		"foobar_source",
		&database.Task{
			UserID: 	userID,
			Title: 		&title2,
			SharedUntil: *testutils.CreateDateTime("1999-01-01"),
		},
	)
	assert.NoError(t, err)
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	

	t.Run("MalformmatedTaskID", func(t *testing.T) {
		response := ServeRequest(t, authToken, "GET", "/shareable_tasks/123/", nil, http.StatusNotFound, api)
		assert.Equal(t, `{"detail":"not found"}`, string(response))
	})
	t.Run("InvalidTaskID", func(t *testing.T) {
		invalidTaskID := primitive.NewObjectID().Hex()
		response := ServeRequest(t,authToken, "GET", fmt.Sprintf("/shareable_tasks/%s/", invalidTaskID), nil, http.StatusOK, api)
		assert.Equal(t, `
<!DOCTYPE html>
<html>
<head>
	<meta http-equiv="Refresh" content="0; url='http://localhost:3000/task/`+invalidTaskID+`'" />
</head>
<body>
</body>
</html>`, string(response))
	})
	t.Run("TaskIsNotShared", func(t *testing.T) {
		response := ServeRequest(t, authToken, "GET", fmt.Sprintf("/shareable_tasks/%s/", task2.ID.Hex()), nil, http.StatusOK, api)
		assert.Equal(t, `
<!DOCTYPE html>
<html>
<head>
	<meta http-equiv="Refresh" content="0; url='http://localhost:3000/task/`+task2.ID.Hex()+`'" />
</head>
<body>
</body>
</html>`, string(response))
	})
	t.Run("TaskIsShared", func(t *testing.T) {
		response := ServeRequest(t,authToken, "GET", fmt.Sprintf("/shareable_tasks/%s/", task1.ID.Hex()), nil, http.StatusOK, api)
		assert.Equal(t, `
<!DOCTYPE html>
<html>
<head>
	<meta http-equiv="Refresh" content="0; url='http://localhost:3000/task/`+task1.ID.Hex()+`'" />
</head>
<body>
</body>
</html>`, string(response))
	})
}
