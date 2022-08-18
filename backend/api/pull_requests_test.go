package api

import (
	"encoding/json"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"go.mongodb.org/mongo-driver/mongo"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
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
	timePullRequestUpdated := time.Date(2022, time.January, 1, 0, 0, 0, 0, time.UTC)
	pullRequest1, err := createTestPullRequest(db, userID, "dogecoin", false, true, external.ActionAddReviewers, timePullRequestUpdated)
	assert.NoError(t, err)
	pullRequest2, err := createTestPullRequest(db, userID, "dogecoin", false, true, external.ActionFixFailedCI, timePullRequestUpdated)
	assert.NoError(t, err)
	pullRequest3, err := createTestPullRequest(db, userID, "dogecoin", false, true, external.ActionMergePR, timePullRequestUpdated)
	assert.NoError(t, err)
	pullRequest4, err := createTestPullRequest(db, userID, "dogecoin", false, true, external.ActionWaitingOnReview, timePullRequestUpdated)
	assert.NoError(t, err)
	pullRequest5, err := createTestPullRequest(db, userID, "dogecoin", false, true, external.ActionAddressComments, timePullRequestUpdated)
	assert.NoError(t, err)
	pullRequest6, err := createTestPullRequest(db, userID, "dogecoin", false, true, external.ActionFixMergeConflicts, timePullRequestUpdated)
	assert.NoError(t, err)
	pullRequest7, err := createTestPullRequest(db, userID, "dogecoin", false, true, external.ActionReviewPR, timePullRequestUpdated)
	assert.NoError(t, err)
	pullRequest8, err := createTestPullRequest(db, userID, "dogecoin", false, true, external.ActionWaitingOnCI, timePullRequestUpdated)
	assert.NoError(t, err)
	// completed PR
	_, err = createTestPullRequest(db, userID, "dogecoin", true, true, "", timePullRequestUpdated)
	assert.NoError(t, err)
	// wrong user id
	_, err = createTestPullRequest(db, notUserID, "dogecoin", false, true, "", timePullRequestUpdated)
	assert.NoError(t, err)
	// first PR in second repo
	pullRequest9, err := createTestPullRequest(db, userID, "tesla", false, true, external.ActionAddReviewers, timePullRequestUpdated)
	assert.NoError(t, err)
	// second PR in second repo, last updated an hour ago
	timeHourEarlier := timePullRequestUpdated.Add(-1 * time.Hour)
	pullRequest10, err := createTestPullRequest(db, userID, "tesla", false, true, external.ActionAddReviewers, timeHourEarlier)
	assert.NoError(t, err)

	UnauthorizedTest(t, "GET", "/pull_requests/", nil)
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
		assert.Equal(t, []RepositoryResult{
			{
				ID:   "dogecoin",
				Name: "dogecoin",
				PullRequests: []PullRequestResult{
					{
						ID: pullRequest7.ID.Hex(),
						Status: PullRequestStatus{
							Text:  "Review PR",
							Color: "yellow",
						},
						CreatedAt:     "1970-01-01T00:00:00Z",
						LastUpdatedAt: primitive.NewDateTimeFromTime(timePullRequestUpdated).Time().UTC().Format(time.RFC3339),
					},
					{
						ID: pullRequest1.ID.Hex(),
						Status: PullRequestStatus{
							Text:  "Add Reviewers",
							Color: "yellow",
						},
						CreatedAt:     "1970-01-01T00:00:00Z",
						LastUpdatedAt: primitive.NewDateTimeFromTime(timePullRequestUpdated).Time().UTC().Format(time.RFC3339),
					},
					{
						ID: pullRequest2.ID.Hex(),
						Status: PullRequestStatus{
							Text:  "Fix Failed CI",
							Color: "red",
						},
						CreatedAt:     "1970-01-01T00:00:00Z",
						LastUpdatedAt: primitive.NewDateTimeFromTime(timePullRequestUpdated).Time().UTC().Format(time.RFC3339),
					},
					{
						ID: pullRequest5.ID.Hex(),
						Status: PullRequestStatus{
							Text:  "Address Comments",
							Color: "yellow",
						},
						CreatedAt:     "1970-01-01T00:00:00Z",
						LastUpdatedAt: primitive.NewDateTimeFromTime(timePullRequestUpdated).Time().UTC().Format(time.RFC3339),
					},
					{
						ID: pullRequest6.ID.Hex(),
						Status: PullRequestStatus{
							Text:  "Fix Merge Conflicts",
							Color: "red",
						},
						CreatedAt:     "1970-01-01T00:00:00Z",
						LastUpdatedAt: primitive.NewDateTimeFromTime(timePullRequestUpdated).Time().UTC().Format(time.RFC3339),
					},
					{
						ID: pullRequest8.ID.Hex(),
						Status: PullRequestStatus{
							Text:  "Waiting on CI",
							Color: "gray",
						},
						CreatedAt:     "1970-01-01T00:00:00Z",
						LastUpdatedAt: primitive.NewDateTimeFromTime(timePullRequestUpdated).Time().UTC().Format(time.RFC3339),
					},
					{
						ID: pullRequest3.ID.Hex(),
						Status: PullRequestStatus{
							Text:  "Merge PR",
							Color: "green",
						},
						CreatedAt:     "1970-01-01T00:00:00Z",
						LastUpdatedAt: primitive.NewDateTimeFromTime(timePullRequestUpdated).Time().UTC().Format(time.RFC3339),
					},
					{
						ID: pullRequest4.ID.Hex(),
						Status: PullRequestStatus{
							Text:  "Waiting on Review",
							Color: "gray",
						},
						CreatedAt:     "1970-01-01T00:00:00Z",
						LastUpdatedAt: primitive.NewDateTimeFromTime(timePullRequestUpdated).Time().UTC().Format(time.RFC3339),
					},
				},
			},
			{
				ID:   "tesla",
				Name: "tesla",
				PullRequests: []PullRequestResult{
					{
						ID: pullRequest9.ID.Hex(),
						Status: PullRequestStatus{
							Text:  "Add Reviewers",
							Color: "yellow",
						},
						CreatedAt:     "1970-01-01T00:00:00Z",
						LastUpdatedAt: primitive.NewDateTimeFromTime(timePullRequestUpdated).Time().UTC().Format(time.RFC3339),
					},
					{
						ID: pullRequest10.ID.Hex(),
						Status: PullRequestStatus{
							Text:  "Add Reviewers",
							Color: "yellow",
						},
						CreatedAt:     "1970-01-01T00:00:00Z",
						LastUpdatedAt: primitive.NewDateTimeFromTime(timeHourEarlier).Time().UTC().Format(time.RFC3339),
					},
				},
			},
		}, result)
	})
}

func createTestPullRequest(db *mongo.Database, userID primitive.ObjectID, repositoryName string, isCompleted bool, isPullRequest bool, requiredAction string, lastUpdatedAt time.Time) (*database.PullRequest, error) {
	externalID := primitive.NewObjectID().Hex()
	lastUpdatedAtPrimitive := primitive.NewDateTimeFromTime(lastUpdatedAt)
	return database.GetOrCreatePullRequest(
		db,
		userID,
		externalID,
		"foobar_source",
		&database.PullRequest{
			IDExternal:     externalID,
			SourceID:       "foobar_source",
			UserID:         userID,
			RepositoryID:   repositoryName,
			RepositoryName: repositoryName,
			RequiredAction: requiredAction,
			IsCompleted:    &isCompleted,
			LastUpdatedAt:  lastUpdatedAtPrimitive,
		},
	)
}
