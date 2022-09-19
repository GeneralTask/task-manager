package api

import (
	"context"
	"encoding/json"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"go.mongodb.org/mongo-driver/mongo"

	"github.com/GeneralTask/task-manager/backend/constants"
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

	// Create dummy repositories
	repositoryCollection := database.GetRepositoryCollection(db)
	repositoryID1 := primitive.NewObjectID().Hex()
	repositoryID2 := primitive.NewObjectID().Hex()
	repositoryID3 := primitive.NewObjectID().Hex()

	repositoryName1 := "stonks/test_repository"
	repositoryName2 := "stonks/test_repository2"
	repositoryName3 := "stonks/test_repository3"

	repository1 := &database.Repository{
		UserID:       userID,
		RepositoryID: repositoryID1,
		FullName:     repositoryName1,
	}
	repository2 := &database.Repository{
		UserID:       userID,
		RepositoryID: repositoryID2,
		FullName:     repositoryName2,
	}
	notUserID := primitive.NewObjectID()
	repository3 := &database.Repository{
		UserID:       notUserID,
		RepositoryID: repositoryID3,
		FullName:     repositoryName3,
	}
	_, err = repositoryCollection.InsertMany(context.Background(), []interface{}{repository1, repository2, repository3})
	assert.NoError(t, err)

	timePullRequestUpdated := time.Date(2022, time.January, 1, 0, 0, 0, 0, time.UTC)
	pullRequest1, err := createTestPullRequest(db, userID, repositoryName1, false, true, external.ActionAddReviewers, timePullRequestUpdated, repositoryID1)
	assert.NoError(t, err)
	pullRequest2, err := createTestPullRequest(db, userID, repositoryName1, false, true, external.ActionFixFailedCI, timePullRequestUpdated, repositoryID1)
	assert.NoError(t, err)
	pullRequest3, err := createTestPullRequest(db, userID, repositoryName1, false, true, external.ActionMergePR, timePullRequestUpdated, repositoryID1)
	assert.NoError(t, err)
	pullRequest4, err := createTestPullRequest(db, userID, repositoryName1, false, true, external.ActionWaitingOnReview, timePullRequestUpdated, repositoryID1)
	assert.NoError(t, err)
	pullRequest5, err := createTestPullRequest(db, userID, repositoryName1, false, true, external.ActionAddressComments, timePullRequestUpdated, repositoryID1)
	assert.NoError(t, err)
	pullRequest6, err := createTestPullRequest(db, userID, repositoryName1, false, true, external.ActionFixMergeConflicts, timePullRequestUpdated, repositoryID1)
	assert.NoError(t, err)
	pullRequest7, err := createTestPullRequest(db, userID, repositoryName1, false, true, external.ActionReviewPR, timePullRequestUpdated, repositoryID1)
	assert.NoError(t, err)
	pullRequest8, err := createTestPullRequest(db, userID, repositoryName1, false, true, external.ActionWaitingOnCI, timePullRequestUpdated, repositoryID1)
	assert.NoError(t, err)
	pullRequest9, err := createTestPullRequest(db, userID, repositoryName1, false, true, external.ActionWaitingOnAuthor, timePullRequestUpdated, repositoryID1)
	assert.NoError(t, err)
	// completed PR
	_, err = createTestPullRequest(db, userID, repositoryName2, true, true, "", timePullRequestUpdated, repositoryID2)
	assert.NoError(t, err)
	// wrong user id
	_, err = createTestPullRequest(db, notUserID, repositoryName2, false, true, "", timePullRequestUpdated, repositoryID2)
	assert.NoError(t, err)
	// first PR in second repo
	pullRequest10, err := createTestPullRequest(db, userID, repositoryName2, false, true, external.ActionAddReviewers, timePullRequestUpdated, repositoryID2)
	assert.NoError(t, err)
	// second PR in second repo, last updated an hour ago
	timeHourEarlier := timePullRequestUpdated.Add(-1 * time.Hour)
	pullRequest11, err := createTestPullRequest(db, userID, repositoryName2, false, true, external.ActionAddReviewers, timeHourEarlier, repositoryID2)
	assert.NoError(t, err)

	UnauthorizedTest(t, "GET", "/pull_requests/", nil)
	t.Run("Success", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
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
				ID:   repositoryID1,
				Name: repositoryName1,
				PullRequests: []*PullRequestResult{
					{
						Title: "fix the oopsie",
						Body:  "oopsie whoopsie",
						ID:    pullRequest7.ID.Hex(),
						Status: PullRequestStatus{
							Text:  "Review PR",
							Color: "yellow",
						},
						Comments: []PullRequestComment{{
							Type:            constants.COMMENT_TYPE_INLINE,
							Body:            "This is a comment",
							Author:          "chad1616",
							Filepath:        "tothemoon.txt",
							LineNumberStart: 69,
							LineNumberEnd:   420,
							CreatedAt:       "2022-04-20T19:01:12Z",
						}},
						CreatedAt:     "1970-01-01T00:00:00Z",
						LastUpdatedAt: primitive.NewDateTimeFromTime(timePullRequestUpdated).Time().UTC().Format(time.RFC3339),
						Additions:     690,
						Deletions:     42,
					},
					{
						Title: "fix the oopsie",
						Body:  "oopsie whoopsie",
						ID:    pullRequest1.ID.Hex(),
						Status: PullRequestStatus{
							Text:  "Add Reviewers",
							Color: "yellow",
						},
						Comments: []PullRequestComment{{
							Type:            constants.COMMENT_TYPE_INLINE,
							Body:            "This is a comment",
							Author:          "chad1616",
							Filepath:        "tothemoon.txt",
							LineNumberStart: 69,
							LineNumberEnd:   420,
							CreatedAt:       "2022-04-20T19:01:12Z",
						}},
						CreatedAt:     "1970-01-01T00:00:00Z",
						LastUpdatedAt: primitive.NewDateTimeFromTime(timePullRequestUpdated).Time().UTC().Format(time.RFC3339),
						Additions:     690,
						Deletions:     42,
					},
					{
						Title: "fix the oopsie",
						Body:  "oopsie whoopsie",
						ID:    pullRequest2.ID.Hex(),
						Status: PullRequestStatus{
							Text:  "Fix Failed CI",
							Color: "red",
						},
						Comments: []PullRequestComment{{
							Type:            constants.COMMENT_TYPE_INLINE,
							Body:            "This is a comment",
							Author:          "chad1616",
							Filepath:        "tothemoon.txt",
							LineNumberStart: 69,
							LineNumberEnd:   420,
							CreatedAt:       "2022-04-20T19:01:12Z",
						}},
						CreatedAt:     "1970-01-01T00:00:00Z",
						LastUpdatedAt: primitive.NewDateTimeFromTime(timePullRequestUpdated).Time().UTC().Format(time.RFC3339),
						Additions:     690,
						Deletions:     42,
					},
					{
						Title: "fix the oopsie",
						Body:  "oopsie whoopsie",
						ID:    pullRequest5.ID.Hex(),
						Status: PullRequestStatus{
							Text:  "Address Comments",
							Color: "yellow",
						},
						Comments: []PullRequestComment{{
							Type:            constants.COMMENT_TYPE_INLINE,
							Body:            "This is a comment",
							Author:          "chad1616",
							Filepath:        "tothemoon.txt",
							LineNumberStart: 69,
							LineNumberEnd:   420,
							CreatedAt:       "2022-04-20T19:01:12Z",
						}},
						CreatedAt:     "1970-01-01T00:00:00Z",
						LastUpdatedAt: primitive.NewDateTimeFromTime(timePullRequestUpdated).Time().UTC().Format(time.RFC3339),
						Additions:     690,
						Deletions:     42,
					},
					{
						Title: "fix the oopsie",
						Body:  "oopsie whoopsie",
						ID:    pullRequest6.ID.Hex(),
						Status: PullRequestStatus{
							Text:  "Fix Merge Conflicts",
							Color: "red",
						},
						Comments: []PullRequestComment{{
							Type:            constants.COMMENT_TYPE_INLINE,
							Body:            "This is a comment",
							Author:          "chad1616",
							Filepath:        "tothemoon.txt",
							LineNumberStart: 69,
							LineNumberEnd:   420,
							CreatedAt:       "2022-04-20T19:01:12Z",
						}},
						CreatedAt:     "1970-01-01T00:00:00Z",
						LastUpdatedAt: primitive.NewDateTimeFromTime(timePullRequestUpdated).Time().UTC().Format(time.RFC3339),
						Additions:     690,
						Deletions:     42,
					},
					{
						Title: "fix the oopsie",
						Body:  "oopsie whoopsie",
						ID:    pullRequest8.ID.Hex(),
						Status: PullRequestStatus{
							Text:  "Waiting on CI",
							Color: "gray",
						},
						Comments: []PullRequestComment{{
							Type:            constants.COMMENT_TYPE_INLINE,
							Body:            "This is a comment",
							Author:          "chad1616",
							Filepath:        "tothemoon.txt",
							LineNumberStart: 69,
							LineNumberEnd:   420,
							CreatedAt:       "2022-04-20T19:01:12Z",
						}},
						CreatedAt:     "1970-01-01T00:00:00Z",
						LastUpdatedAt: primitive.NewDateTimeFromTime(timePullRequestUpdated).Time().UTC().Format(time.RFC3339),
						Additions:     690,
						Deletions:     42,
					},
					{
						Title: "fix the oopsie",
						Body:  "oopsie whoopsie",
						ID:    pullRequest3.ID.Hex(),
						Status: PullRequestStatus{
							Text:  "Merge PR",
							Color: "green",
						},
						Comments: []PullRequestComment{{
							Type:            constants.COMMENT_TYPE_INLINE,
							Body:            "This is a comment",
							Author:          "chad1616",
							Filepath:        "tothemoon.txt",
							LineNumberStart: 69,
							LineNumberEnd:   420,
							CreatedAt:       "2022-04-20T19:01:12Z",
						}},
						CreatedAt:     "1970-01-01T00:00:00Z",
						LastUpdatedAt: primitive.NewDateTimeFromTime(timePullRequestUpdated).Time().UTC().Format(time.RFC3339),
						Additions:     690,
						Deletions:     42,
					},
					{
						Title: "fix the oopsie",
						Body:  "oopsie whoopsie",
						ID:    pullRequest4.ID.Hex(),
						Status: PullRequestStatus{
							Text:  "Waiting on Review",
							Color: "gray",
						},
						Comments: []PullRequestComment{{
							Type:            constants.COMMENT_TYPE_INLINE,
							Body:            "This is a comment",
							Author:          "chad1616",
							Filepath:        "tothemoon.txt",
							LineNumberStart: 69,
							LineNumberEnd:   420,
							CreatedAt:       "2022-04-20T19:01:12Z",
						}},
						CreatedAt:     "1970-01-01T00:00:00Z",
						LastUpdatedAt: primitive.NewDateTimeFromTime(timePullRequestUpdated).Time().UTC().Format(time.RFC3339),
						Additions:     690,
						Deletions:     42,
					},
					{
						Title: "fix the oopsie",
						Body:  "oopsie whoopsie",
						ID:    pullRequest9.ID.Hex(),
						Status: PullRequestStatus{
							Text:  "Waiting on Author",
							Color: "gray",
						},
						Comments: []PullRequestComment{{
							Type:            constants.COMMENT_TYPE_INLINE,
							Body:            "This is a comment",
							Author:          "chad1616",
							Filepath:        "tothemoon.txt",
							LineNumberStart: 69,
							LineNumberEnd:   420,
							CreatedAt:       "2022-04-20T19:01:12Z",
						}},
						CreatedAt:     "1970-01-01T00:00:00Z",
						LastUpdatedAt: primitive.NewDateTimeFromTime(timePullRequestUpdated).Time().UTC().Format(time.RFC3339),
						Additions:     690,
						Deletions:     42,
					},
				},
			},
			{
				ID:   repositoryID2,
				Name: repositoryName2,
				PullRequests: []*PullRequestResult{
					{
						Title: "fix the oopsie",
						Body:  "oopsie whoopsie",
						ID:    pullRequest10.ID.Hex(),
						Status: PullRequestStatus{
							Text:  "Add Reviewers",
							Color: "yellow",
						},
						Comments: []PullRequestComment{{
							Type:            constants.COMMENT_TYPE_INLINE,
							Body:            "This is a comment",
							Author:          "chad1616",
							Filepath:        "tothemoon.txt",
							LineNumberStart: 69,
							LineNumberEnd:   420,
							CreatedAt:       "2022-04-20T19:01:12Z",
						}},
						CreatedAt:     "1970-01-01T00:00:00Z",
						LastUpdatedAt: primitive.NewDateTimeFromTime(timePullRequestUpdated).Time().UTC().Format(time.RFC3339),
						Additions:     690,
						Deletions:     42,
					},
					{
						Title: "fix the oopsie",
						Body:  "oopsie whoopsie",
						ID:    pullRequest11.ID.Hex(),
						Status: PullRequestStatus{
							Text:  "Add Reviewers",
							Color: "yellow",
						},
						Comments: []PullRequestComment{{
							Type:            constants.COMMENT_TYPE_INLINE,
							Body:            "This is a comment",
							Author:          "chad1616",
							Filepath:        "tothemoon.txt",
							LineNumberStart: 69,
							LineNumberEnd:   420,
							CreatedAt:       "2022-04-20T19:01:12Z",
						}},
						CreatedAt:     "1970-01-01T00:00:00Z",
						LastUpdatedAt: primitive.NewDateTimeFromTime(timeHourEarlier).Time().UTC().Format(time.RFC3339),
						Additions:     690,
						Deletions:     42,
					},
				},
			},
		}, result)
	})
}

func createTestPullRequest(db *mongo.Database, userID primitive.ObjectID, repositoryName string, isCompleted bool, isPullRequest bool, requiredAction string, lastUpdatedAt time.Time, repositoryID string) (*database.PullRequest, error) {
	externalID := primitive.NewObjectID().Hex()
	lastUpdatedAtPrimitive := primitive.NewDateTimeFromTime(lastUpdatedAt)
	commentCreatedAtTime, _ := time.Parse(time.RFC3339, "2022-04-20T19:01:12Z")
	commentCreatedAt := primitive.NewDateTimeFromTime(commentCreatedAtTime)
	return database.GetOrCreatePullRequest(
		db,
		userID,
		externalID,
		"foobar_source",
		&database.PullRequest{
			Title:          "fix the oopsie",
			Body:           "oopsie whoopsie",
			IDExternal:     externalID,
			IsCompleted:    &isCompleted,
			SourceID:       "foobar_source",
			UserID:         userID,
			RepositoryID:   repositoryID,
			RepositoryName: repositoryName,
			RequiredAction: requiredAction,
			LastUpdatedAt:  lastUpdatedAtPrimitive,
			Comments: []database.PullRequestComment{{
				Type:            constants.COMMENT_TYPE_INLINE,
				Body:            "This is a comment",
				Author:          "chad1616",
				Filepath:        "tothemoon.txt",
				LineNumberStart: 69,
				LineNumberEnd:   420,
				CreatedAt:       commentCreatedAt,
			}},
			Additions: 690,
			Deletions: 42,
		},
	)
}
