package external

import (
	"context"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/testutils"
	"github.com/google/go-github/v45/github"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
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
		err := gmailTask.ModifyTask(userID, "sample_account@email.com", "6942069420", &database.TaskItemChangeableFields{IsCompleted: &isCompleted})
		assert.NoError(t, err)
	})
}

func TestGetPullRequests(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		userId := primitive.NewObjectID()
		fetchExternalAPITokenValue := false

		githubUserServer := testutils.GetMockAPIServer(t, 200, testutils.UserResponsePayload)
		userURL := &githubUserServer.URL
		defer githubUserServer.Close()

		githubUserRepositoriesServer := testutils.GetMockAPIServer(t, 200, testutils.UserRepositoriesPayload)
		userRepositoriesURL := &githubUserRepositoriesServer.URL
		defer githubUserRepositoriesServer.Close()

		githubUserPullRequestsServer := testutils.GetMockAPIServer(t, 200, testutils.UserPullRequestsPayload)
		userPullRequestsURL := &githubUserPullRequestsServer.URL
		defer githubUserPullRequestsServer.Close()

		githubPullRequestReviewersServer := testutils.GetMockAPIServer(t, 200, testutils.PullRequestReviewersPayload)
		pullRequestReviewersURL := &githubPullRequestReviewersServer.URL
		defer githubPullRequestReviewersServer.Close()

		githubListCheckRunsForRefServer := testutils.GetMockAPIServer(t, 200, testutils.CheckRunsForRefPayload)
		listCheckRunsForRefURL := &githubListCheckRunsForRefServer.URL
		defer githubListCheckRunsForRefServer.Close()

		githubListPullRequestCommentsServer := testutils.GetMockAPIServer(t, 200, `[]`)
		listPullRequestCommentsURL := &githubListPullRequestCommentsServer.URL
		defer githubListPullRequestCommentsServer.Close()

		var pullRequests = make(chan PullRequestResult)
		githubPR := GithubPRSource{
			Github: GithubService{
				Config: GithubConfig{
					ConfigValues: GithubConfigValues{
						FetchExternalAPIToken:       &fetchExternalAPITokenValue,
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

		expectedPullRequest := database.PullRequest{
			RepositoryId:   "1234",
			RepositoryName: "ExampleRepository",
			Number:         420,
			Author:         "chad1616",
			Branch:         "ExampleBranch",
			RequiredAction: "Add Reviewers",
			CommentCount:   0,
		}
		assert.NoError(t, result.Error)
		assert.Equal(t, len(result.PullRequests), 1)
		assert.Equal(t, expectedPullRequest, result.PullRequests[0].PullRequest)
	})
	t.Run("NoPullRequests", func(t *testing.T) {
		userId := primitive.NewObjectID()
		fetchExternalAPITokenValue := false

		githubUserServer := testutils.GetMockAPIServer(t, 200, testutils.UserResponsePayload)
		userURL := &githubUserServer.URL
		defer githubUserServer.Close()

		githubUserRepositoriesServer := testutils.GetMockAPIServer(t, 200, testutils.UserRepositoriesPayload)
		userRepositoriesURL := &githubUserRepositoriesServer.URL
		defer githubUserRepositoriesServer.Close()

		githubUserPullRequestsServer := testutils.GetMockAPIServer(t, 200, `[]`)
		userPullRequestsURL := &githubUserPullRequestsServer.URL
		defer githubUserPullRequestsServer.Close()

		var pullRequests = make(chan PullRequestResult)
		githubPR := GithubPRSource{
			Github: GithubService{
				Config: GithubConfig{
					ConfigValues: GithubConfigValues{
						FetchExternalAPIToken: &fetchExternalAPITokenValue,
						GetUserURL:            userURL,
						ListRepositoriesURL:   userRepositoriesURL,
						ListPullRequestsURL:   userPullRequestsURL,
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
		fetchExternalAPITokenValue := false

		githubUserServer := testutils.GetMockAPIServer(t, 200, testutils.UserResponsePayload)
		userURL := &githubUserServer.URL
		defer githubUserServer.Close()

		githubUserRepositoriesServer := testutils.GetMockAPIServer(t, 200, `[]`)
		userRepositoriesURL := &githubUserRepositoriesServer.URL
		defer githubUserRepositoriesServer.Close()

		var pullRequests = make(chan PullRequestResult)
		githubPR := GithubPRSource{
			Github: GithubService{
				Config: GithubConfig{
					ConfigValues: GithubConfigValues{
						FetchExternalAPIToken: &fetchExternalAPITokenValue,
						GetUserURL:            userURL,
						ListRepositoriesURL:   userRepositoriesURL,
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
		fetchExternalAPITokenValue := false

		var pullRequests = make(chan PullRequestResult)
		githubPR := GithubPRSource{
			Github: GithubService{
				Config: GithubConfig{
					ConfigValues: GithubConfigValues{
						FetchExternalAPIToken: &fetchExternalAPITokenValue,
					},
				},
			},
		}
		go githubPR.GetPullRequests(userId, "exampleAccountID", pullRequests)
		result := <-pullRequests

		assert.Equal(t, result.Error.Error(), "failed to fetch Github user")
		assert.Error(t, result.Error)
	})
}

func TestSetOverrideURL(t *testing.T) {
	t.Run("WithOverrideURL", func(t *testing.T) {
		githubClient := *github.NewClient(nil)
		setOverrideURL(&githubClient, nil)
		assert.Equal(t, githubClient.BaseURL.String(), "https://api.github.com/")
	})
	t.Run("WithoutOverrideURL", func(t *testing.T) {
		githubClient := *github.NewClient(nil)
		overrideURL := "https://nicememe.com"
		setOverrideURL(&githubClient, &overrideURL)
		assert.Equal(t, githubClient.BaseURL.String(), "https://nicememe.com/")
	})
}

func TestGetGithubUser(t *testing.T) {
	t.Run("SuccessWithOverrideURL", func(t *testing.T) {
		githubUserServer := testutils.GetMockAPIServer(t, 200, testutils.UserResponsePayload)
		userURL := &githubUserServer.URL
		ctx := context.Background()
		githubClient := github.NewClient(nil)
		githubUser, err := getGithubUser(ctx, githubClient, "", userURL)

		assert.NoError(t, err)
		assert.Equal(t, *githubUser.Login, "chad1616")
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
