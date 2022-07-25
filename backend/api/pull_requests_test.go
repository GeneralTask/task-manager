package api

import (
	"encoding/json"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"go.mongodb.org/mongo-driver/mongo"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestPullRequestList(t *testing.T) {
	authToken := login("test_pull_request_list@generaltask.com", "")

	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := getUserIDFromAuthToken(t, db, authToken)
	notUserID := primitive.NewObjectID()
	pullRequest1, err := createTestPullRequest(db, userID, "dogecoin", false, true)
	assert.NoError(t, err)
	// wrong user id
	_, err = createTestPullRequest(db, notUserID, "dogecoin", false, true)
	assert.NoError(t, err)
	// completed PR
	_, err = createTestPullRequest(db, userID, "dogecoin", true, true)
	assert.NoError(t, err)
	// not a PR
	_, err = createTestPullRequest(db, userID, "dogecoin", false, false)
	assert.NoError(t, err)
	// second PR in first repo
	pullRequest2, err := createTestPullRequest(db, userID, "dogecoin", false, true)
	assert.NoError(t, err)
	// first PR in second repo
	pullRequest3, err := createTestPullRequest(db, userID, "tesla", false, true)
	assert.NoError(t, err)

	t.Run("Unauthorized", func(t *testing.T) {
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("GET", "/pull_requests/", nil)

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusUnauthorized, recorder.Code)
	})
	t.Run("Success", func(t *testing.T) {
		router := GetRouter(GetAPI())
		request, _ := http.NewRequest("GET", "/pull_requests/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := ioutil.ReadAll(recorder.Body)
		assert.NoError(t, err)
		var result []RepositoryResult
		err = json.Unmarshal(body, &result)
		assert.NoError(t, err)
		assert.Equal(t, 2, len(result))
		assert.Equal(t, result, []RepositoryResult{
			{
				ID:   "dogecoin",
				Name: "dogecoin",
				PullRequests: []PullRequestResult{
					{
						ID:            pullRequest1.ID.Hex(),
						Status:        PullRequestStatus{Color: "gray"},
						CreatedAt:     "1970-01-01T00:00:00Z",
						LastUpdatedAt: "1970-01-01T00:00:00Z",
					},
					{
						ID:            pullRequest2.ID.Hex(),
						Status:        PullRequestStatus{Color: "gray"},
						CreatedAt:     "1970-01-01T00:00:00Z",
						LastUpdatedAt: "1970-01-01T00:00:00Z",
					},
				},
			},
			{
				ID:   "tesla",
				Name: "tesla",
				PullRequests: []PullRequestResult{
					{
						ID:            pullRequest3.ID.Hex(),
						Status:        PullRequestStatus{Color: "gray"},
						CreatedAt:     "1970-01-01T00:00:00Z",
						LastUpdatedAt: "1970-01-01T00:00:00Z",
					},
				},
			},
		})
	})
}

func createTestPullRequest(db *mongo.Database, userID primitive.ObjectID, repositoryName string, isCompleted bool, isPullRequest bool) (*database.Item, error) {
	externalID := primitive.NewObjectID().Hex()
	return database.GetOrCreateItem(
		db,
		userID,
		externalID,
		"foobar_source",
		&database.Item{
			TaskBase: database.TaskBase{
				IDExternal:  externalID,
				IsCompleted: isCompleted,
				SourceID:    "foobar_source",
				UserID:      userID,
			},
			TaskType: database.TaskType{
				IsPullRequest: isPullRequest,
			},
			PullRequest: database.PullRequest{
				RepositoryID:   repositoryName,
				RepositoryName: repositoryName,
			},
		},
	)
}
