package external

import (
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/testutils"
	"github.com/google/go-github/v45/github"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	ClientResponsePayload   string = `{"id": 1, "plan": {}}`
	UserResponsePayload     string = `{"id": 1, "login": "chad1616"}`
	UserRepositoriesPayload string = `[{"id": 1234, "name": "MyFirstRepo", "owner": {"login": "gigaChad123"}}]`
	UserPullRequestsPayload string = `[{"id": 1, "number": 420, "title": "Fix big oopsie", "created_at": "2011-01-26T19:01:12Z", "html_url": "github.com", "user": {"login": "chad1616", "id": 1}, "requested_reviewers": [], "head": {"sha": "abc123", "ref": "abc123"}}]`
)

func TestLoadGithubPullRequests(t *testing.T) {
	t.Run("BadIssuesResponse", func(t *testing.T) {})
	t.Run("Success", func(t *testing.T) {})
	t.Run("SuccessExistingPullRequest", func(t *testing.T) {})
}

func TestMarkGithubPRTaskAsDone(t *testing.T) {
	t.Run("MarkAsDone", func(t *testing.T) {
		taskUpdateServer := getMockServer(t, 200, `{"foo": "bar"}`, NoopRequestChecker)
		defer taskUpdateServer.Close()
		gmailTask := GithubPRSource{}
		userID := primitive.NewObjectID()

		isCompleted := true
		err := gmailTask.ModifyTask(userID, "sample_account@email.com", "6942069420", &database.TaskChangeableFields{IsCompleted: &isCompleted})
		assert.NoError(t, err)
	})
}

func TestGetPullRequests(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		userId := primitive.NewObjectID()
		githubClientServer := testutils.GetMockAPIServer(t, 200, ClientResponsePayload)
		clientServerURL := &githubClientServer.URL

		githubUserServer := testutils.GetMockAPIServer(t, 200, UserResponsePayload)
		userURL := &githubUserServer.URL

		githubUserRepositoriesServer := testutils.GetMockAPIServer(t, 200, UserRepositoriesPayload)
		userRepositoriesURL := &githubUserRepositoriesServer.URL

		githubUserPullRequestsServer := testutils.GetMockAPIServer(t, 200, UserPullRequestsPayload)
		userPullRequestsURL := &githubUserPullRequestsServer.URL

		githubPullRequestReviewersServer := testutils.GetMockAPIServer(t, 200, `{"users": []}`)
		pullRequestReviewersURL := &githubPullRequestReviewersServer.URL

		githubListCheckRunsForRefServer := testutils.GetMockAPIServer(t, 200, `{"total_count": 0, "check_runs": []}`)
		listCheckRunsForRefURL := &githubListCheckRunsForRefServer.URL

		githubListPullRequestCommentsServer := testutils.GetMockAPIServer(t, 200, `[]`)
		listPullRequestCommentsURL := &githubListPullRequestCommentsServer.URL

		var pullRequests = make(chan PullRequestResult)
		githubPR := GithubPRSource{
			Github: GithubService{
				Config: GithubConfig{
					ConfigValues: GithubConfigValues{
						GithubClientURL:             clientServerURL,
						GetUserURL:                  userURL,
						ListRepositoriesURL:         userRepositoriesURL,
						ListPullRequestsURL:         userPullRequestsURL,
						ListPullRequestCommentsURL:  listPullRequestCommentsURL,
						ListPullRequestReviewersURL: pullRequestReviewersURL,
						ListCheckRunsForRefURL:      listCheckRunsForRefURL,
					},
				},
			},
		}
		go githubPR.GetPullRequests(userId, "exampleAccountID", pullRequests)
		result := <-pullRequests
		assert.NoError(t, result.Error)
		assert.Equal(t, 1, len(result.PullRequests))
	})
	t.Run("NoPullRequests", func(t *testing.T) {
		userId := primitive.NewObjectID()
		githubClientURLServer := testutils.GetMockAPIServer(t, 200, ClientResponsePayload)
		clientServerURL := &githubClientURLServer.URL

		githubUserServer := testutils.GetMockAPIServer(t, 200, UserResponsePayload)
		userURL := &githubUserServer.URL

		githubUserRepositoriesServer := testutils.GetMockAPIServer(t, 200, UserRepositoriesPayload)
		userRepositoriesURL := &githubUserRepositoriesServer.URL

		githubUserPullRequestsServer := testutils.GetMockAPIServer(t, 200, `[]`)
		userPullRequestsURL := &githubUserPullRequestsServer.URL

		var pullRequests = make(chan PullRequestResult)
		githubPR := GithubPRSource{
			Github: GithubService{
				Config: GithubConfig{
					ConfigValues: GithubConfigValues{
						GithubClientURL:     clientServerURL,
						GetUserURL:          userURL,
						ListRepositoriesURL: userRepositoriesURL,
						ListPullRequestsURL: userPullRequestsURL,
					},
				},
			},
		}
		go githubPR.GetPullRequests(userId, "exampleAccountID", pullRequests)
		result := <-pullRequests
		assert.NoError(t, result.Error)
		assert.Equal(t, 0, len(result.PullRequests))
	})
	t.Run("NoRepositories", func(t *testing.T) {
		userId := primitive.NewObjectID()
		githubClientServer := testutils.GetMockAPIServer(t, 200, ClientResponsePayload)
		clientServerURL := &githubClientServer.URL

		githubUserServer := testutils.GetMockAPIServer(t, 200, UserResponsePayload)
		userURL := &githubUserServer.URL

		githubUserRepositoriesServer := testutils.GetMockAPIServer(t, 200, `[]`)
		userRepositoriesURL := &githubUserRepositoriesServer.URL

		var pullRequests = make(chan PullRequestResult)
		githubPR := GithubPRSource{
			Github: GithubService{
				Config: GithubConfig{
					ConfigValues: GithubConfigValues{
						GithubClientURL:     clientServerURL,
						GetUserURL:          userURL,
						ListRepositoriesURL: userRepositoriesURL,
					},
				},
			},
		}
		go githubPR.GetPullRequests(userId, "exampleAccountID", pullRequests)
		result := <-pullRequests
		assert.NoError(t, result.Error)
		assert.Equal(t, 0, len(result.PullRequests))
	})
	t.Run("ExternalError", func(t *testing.T) {
		userId := primitive.NewObjectID()
		failedFetchUserServer := getMockServer(t, 401, `{}`, NoopRequestChecker)
		serverURL := &failedFetchUserServer.URL
		defer failedFetchUserServer.Close()

		var pullRequests = make(chan PullRequestResult)
		githubPR := GithubPRSource{
			Github: GithubService{
				Config: GithubConfig{
					ConfigValues: GithubConfigValues{
						GithubClientURL: serverURL,
					},
				},
			},
		}
		go githubPR.GetPullRequests(userId, "exampleAccountID", pullRequests)
		result := <-pullRequests
		assert.Error(t, result.Error)
	})
}

func TestUserIsOwner(t *testing.T) {
	githubUserId1 := int64(1)
	githubUserId2 := int64(2)
	testGithubUser1 := github.User{
		ID: &githubUserId1,
	}
	testGithubUser2 := github.User{
		ID: &githubUserId2,
	}
	testGithubUser3 := github.User{
		ID: nil,
	}
	pullRequestUser1 := github.PullRequest{
		User: &testGithubUser1,
	}
	pullRequestUser3 := github.PullRequest{
		User: &testGithubUser3,
	}

	t.Run("UserIsOwner", func(t *testing.T) {
		assert.True(t, userIsOwner(&testGithubUser1, &pullRequestUser1))
	})
	t.Run("UserIsNotOwner", func(t *testing.T) {
		assert.False(t, userIsOwner(&testGithubUser2, &pullRequestUser1))
	})
	t.Run("UserIdIsNil", func(t *testing.T) {
		assert.False(t, userIsOwner(&testGithubUser3, &pullRequestUser1))
	})
	t.Run("PullRequestUserIdIsNil", func(t *testing.T) {
		assert.False(t, userIsOwner(&testGithubUser1, &pullRequestUser3))
	})
}
