package external

import (
	"context"
	"fmt"
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
		taskUpdateServer := testutils.GetMockAPIServer(t, 200, `{"foo": "bar"}`)
		defer taskUpdateServer.Close()
		githubSource := GithubPRSource{}
		userID := primitive.NewObjectID()

		isCompleted := true
		err := githubSource.ModifyTask(userID, "sample_account@email.com", "6942069420", &database.TaskItemChangeableFields{IsCompleted: &isCompleted}, nil)
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

		githubPullRequestReviewersServer := testutils.GetMockAPIServer(t, 200, testutils.EmptyPullRequestReviewersPayload)
		pullRequestReviewersURL := &githubPullRequestReviewersServer.URL
		defer githubPullRequestReviewersServer.Close()

		githubListCheckRunsForRefServer := testutils.GetMockAPIServer(t, 200, testutils.EmptyCheckRunsForRefPayload)
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
			RepositoryID:   "1234",
			RepositoryName: "ExampleRepository",
			Number:         420,
			Author:         "chad1616",
			Branch:         "ExampleBranch",
			RequiredAction: "Fix Merge Conflicts",
			CommentCount:   0,
			LastUpdatedAt:  1296068472000,
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

func TestSetOverrideURL(t *testing.T) {
	t.Run("Default", func(t *testing.T) {
		githubClient := *github.NewClient(nil)
		setOverrideURL(&githubClient, nil)
		assert.Equal(t, githubClient.BaseURL.String(), "https://api.github.com/")
	})
	t.Run("WithOverrideURL", func(t *testing.T) {
		githubClient := *github.NewClient(nil)
		overrideURL := "https://nicememe.com"
		setOverrideURL(&githubClient, &overrideURL)
		assert.Equal(t, githubClient.BaseURL.String(), "https://nicememe.com/")
	})
}

func TestGetGithubUser(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		githubUserServer := testutils.GetMockAPIServer(t, 200, testutils.UserResponsePayload)
		userURL := &githubUserServer.URL
		defer githubUserServer.Close()
		ctx := context.Background()
		githubClient := github.NewClient(nil)
		githubUser, err := getGithubUser(ctx, githubClient, "", userURL)

		assert.NoError(t, err)
		assert.Equal(t, *githubUser.Login, "chad1616")
	})
	t.Run("BadStatusCode", func(t *testing.T) {
		githubUserServer := testutils.GetMockAPIServer(t, 401, "")
		userURL := &githubUserServer.URL
		defer githubUserServer.Close()
		ctx := context.Background()
		githubClient := github.NewClient(nil)
		githubUser, err := getGithubUser(ctx, githubClient, "", userURL)

		assert.Error(t, err)
		assert.Equal(t, fmt.Sprintf("GET %s/user: 401  []", *userURL), err.Error())
		assert.Nil(t, githubUser)
	})
	t.Run("BadResponse", func(t *testing.T) {
		githubUserServer := testutils.GetMockAPIServer(t, 200, "oopsie")
		userURL := &githubUserServer.URL
		defer githubUserServer.Close()
		ctx := context.Background()
		githubClient := github.NewClient(nil)
		githubUser, err := getGithubUser(ctx, githubClient, "", userURL)

		assert.Error(t, err)
		assert.Equal(t, "invalid character 'o' looking for beginning of value", err.Error())
		assert.Nil(t, githubUser)
	})
}

func TestGithubRepositories(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		githubUserRepositoriesServer := testutils.GetMockAPIServer(t, 200, testutils.UserRepositoriesPayload)
		userRepositoriesURL := &githubUserRepositoriesServer.URL
		defer githubUserRepositoriesServer.Close()
		ctx := context.Background()
		githubClient := github.NewClient(nil)
		githubRepositories, err := getGithubRepositories(ctx, githubClient, "", userRepositoriesURL)

		assert.NoError(t, err)
		assert.Equal(t, len(githubRepositories), 1)
		assert.Equal(t, *githubRepositories[0].Name, "ExampleRepository")
	})
	t.Run("BadStatusCode", func(t *testing.T) {
		githubUserRepositoriesServer := testutils.GetMockAPIServer(t, 401, "")
		userRepositoriesURL := &githubUserRepositoriesServer.URL
		defer githubUserRepositoriesServer.Close()

		ctx := context.Background()
		githubClient := github.NewClient(nil)
		githubRepositories, err := getGithubRepositories(ctx, githubClient, "", userRepositoriesURL)

		assert.Error(t, err)
		assert.Equal(t, fmt.Sprintf("GET %s/user/repos: 401  []", *userRepositoriesURL), err.Error())
		assert.Nil(t, githubRepositories)
	})
	t.Run("BadResponse", func(t *testing.T) {
		githubUserRepositoriesServer := testutils.GetMockAPIServer(t, 200, "oopsie")
		userRepositoriesURL := &githubUserRepositoriesServer.URL
		defer githubUserRepositoriesServer.Close()

		ctx := context.Background()
		githubClient := github.NewClient(nil)
		githubRepositories, err := getGithubRepositories(ctx, githubClient, "", userRepositoriesURL)

		assert.Error(t, err)
		assert.Equal(t, "invalid character 'o' looking for beginning of value", err.Error())
		assert.Nil(t, githubRepositories)
	})
}

func TestGithubPullRequests(t *testing.T) {
	repositoryName := "ExampleRepository"
	repositoryOwner := "chad1616"
	repository := &github.Repository{
		Name: github.String(repositoryName),
		Owner: &github.User{
			Login: github.String(repositoryOwner),
		},
	}
	t.Run("Success", func(t *testing.T) {
		githubUserPullRequestsServer := testutils.GetMockAPIServer(t, 200, testutils.UserPullRequestsPayload)
		userPullRequestsURL := &githubUserPullRequestsServer.URL
		defer githubUserPullRequestsServer.Close()
		ctx := context.Background()
		githubClient := github.NewClient(nil)
		githubPullRequests, err := getGithubPullRequests(ctx, githubClient, repository, userPullRequestsURL)

		assert.NoError(t, err)
		assert.Equal(t, len(githubPullRequests), 1)
		assert.Equal(t, *githubPullRequests[0].Title, "Fix big oopsie")
	})
	t.Run("FailureWithNilRepository", func(t *testing.T) {
		ctx := context.Background()
		githubClient := github.NewClient(nil)
		githubPullRequests, err := getGithubPullRequests(ctx, githubClient, nil, nil)

		assert.Error(t, err)
		assert.Equal(t, "repository is nil", err.Error())
		assert.Nil(t, githubPullRequests)
	})
	t.Run("BadStatusCode", func(t *testing.T) {
		githubUserPullRequestsServer := testutils.GetMockAPIServer(t, 401, "")
		userPullRequestsURL := &githubUserPullRequestsServer.URL
		defer githubUserPullRequestsServer.Close()
		ctx := context.Background()
		githubClient := github.NewClient(nil)
		githubPullRequests, err := getGithubPullRequests(ctx, githubClient, repository, userPullRequestsURL)

		assert.Error(t, err)
		assert.Equal(t, fmt.Sprintf("GET %s/repos/%s/%s/pulls: 401  []", *userPullRequestsURL, repositoryOwner, repositoryName), err.Error())
		assert.Nil(t, githubPullRequests)
	})
	t.Run("BadResponse", func(t *testing.T) {
		githubUserPullRequestsServer := testutils.GetMockAPIServer(t, 200, "oopsie")
		userPullRequestsURL := &githubUserPullRequestsServer.URL
		defer githubUserPullRequestsServer.Close()
		ctx := context.Background()
		githubClient := github.NewClient(nil)
		githubPullRequests, err := getGithubPullRequests(ctx, githubClient, repository, userPullRequestsURL)

		assert.Error(t, err)
		assert.Equal(t, "invalid character 'o' looking for beginning of value", err.Error())
		assert.Nil(t, githubPullRequests)
	})
}

func TestListReviewers(t *testing.T) {
	ctx := context.Background()
	githubClient := github.NewClient(nil)

	repository := &github.Repository{
		Name: github.String("ExampleRepository"),
		Owner: &github.User{
			Login: github.String("chad1616"),
		},
	}
	pullRequest := &github.PullRequest{
		Number: github.Int(1),
	}
	t.Run("Success", func(t *testing.T) {
		githubReviewersServer := testutils.GetMockAPIServer(t, 200, testutils.PullRequestReviewersPayload)
		reviewersURL := &githubReviewersServer.URL
		defer githubReviewersServer.Close()

		githubReviewers, err := listReviewers(ctx, githubClient, repository, pullRequest, reviewersURL)

		assert.NoError(t, err)
		assert.Equal(t, 1, len(githubReviewers.Users))
		assert.Equal(t, "goodTeamMember", *githubReviewers.Users[0].Login)
	})
	t.Run("BadStatusCode", func(t *testing.T) {
		githubReviewersServer := testutils.GetMockAPIServer(t, 503, testutils.PullRequestReviewersPayload)
		reviewersURL := &githubReviewersServer.URL
		defer githubReviewersServer.Close()

		githubReviewers, err := listReviewers(ctx, githubClient, repository, pullRequest, reviewersURL)

		assert.Error(t, err)
		assert.Equal(t, fmt.Sprintf("GET %s/repos/chad1616/ExampleRepository/pulls/1/requested_reviewers: 503  []", *reviewersURL), err.Error())
		assert.Nil(t, githubReviewers)
	})
	t.Run("BadResponse", func(t *testing.T) {
		githubReviewersServer := testutils.GetMockAPIServer(t, 200, "oopsie")
		reviewersURL := &githubReviewersServer.URL
		defer githubReviewersServer.Close()

		githubReviewers, err := listReviewers(ctx, githubClient, repository, pullRequest, reviewersURL)

		assert.Error(t, err)
		assert.Equal(t, "invalid character 'o' looking for beginning of value", err.Error())
		assert.Nil(t, githubReviewers)
	})
	t.Run("FailureWithNilRepository", func(t *testing.T) {
		ctx := context.Background()
		githubClient := github.NewClient(nil)
		pullRequest := &github.PullRequest{
			Number: github.Int(1),
		}
		githubReviewers, err := listReviewers(ctx, githubClient, nil, pullRequest, nil)

		assert.Error(t, err)
		assert.Equal(t, "repository is nil", err.Error())
		assert.Nil(t, githubReviewers)
	})
	t.Run("FailureWithNilPullRequest", func(t *testing.T) {
		ctx := context.Background()
		githubClient := github.NewClient(nil)
		repository := &github.Repository{
			Name: github.String("ExampleRepository"),
			Owner: &github.User{
				Login: github.String("chad1616"),
			},
		}
		githubReviewers, err := listReviewers(ctx, githubClient, repository, nil, nil)

		assert.Error(t, err)
		assert.Equal(t, "pull request is nil", err.Error())
		assert.Nil(t, githubReviewers)
	})
}

func TestListComments(t *testing.T) {
	ctx := context.Background()
	githubClient := github.NewClient(nil)

	repository := &github.Repository{
		Name: github.String("ExampleRepository"),
		Owner: &github.User{
			Login: github.String("chad1616"),
		},
	}
	pullRequest := &github.PullRequest{
		Number: github.Int(1),
	}
	t.Run("Success", func(t *testing.T) {
		githubCommentsServer := testutils.GetMockAPIServer(t, 200, testutils.PullRequestCommentsPayload)
		commentsURL := &githubCommentsServer.URL
		defer githubCommentsServer.Close()

		githubComments, err := listComments(ctx, githubClient, repository, pullRequest, commentsURL)

		assert.NoError(t, err)
		assert.Equal(t, 1, len(githubComments))
		assert.Equal(t, "chad1616", *githubComments[0].User.Login)
	})
	t.Run("BadStatusCode", func(t *testing.T) {
		githubCommentsServer := testutils.GetMockAPIServer(t, 503, testutils.PullRequestCommentsPayload)
		commentsURL := &githubCommentsServer.URL
		defer githubCommentsServer.Close()

		githubComments, err := listComments(ctx, githubClient, repository, pullRequest, commentsURL)

		assert.Error(t, err)
		assert.Equal(t, fmt.Sprintf("GET %s/repos/chad1616/ExampleRepository/pulls/1/comments: 503  []", *commentsURL), err.Error())
		assert.Equal(t, 0, len(githubComments))
	})
	t.Run("BadResponse", func(t *testing.T) {
		githubCommentsServer := testutils.GetMockAPIServer(t, 200, "oopsie")
		commentsURL := &githubCommentsServer.URL
		defer githubCommentsServer.Close()

		githubComments, err := listComments(ctx, githubClient, repository, pullRequest, commentsURL)

		assert.Error(t, err)
		assert.Equal(t, "invalid character 'o' looking for beginning of value", err.Error())
		assert.Equal(t, 0, len(githubComments))
	})
}

func TestCheckRunsForCommit(t *testing.T) {
	ctx := context.Background()
	githubClient := github.NewClient(nil)

	repository := &github.Repository{
		Name: github.String("ExampleRepository"),
		Owner: &github.User{
			Login: github.String("chad1616"),
		},
	}
	pullRequest := &github.PullRequest{
		Number: github.Int(1),
		Head: &github.PullRequestBranch{
			SHA: github.String("abc123"),
		},
	}
	t.Run("Success", func(t *testing.T) {
		githubCheckRunsServer := testutils.GetMockAPIServer(t, 200, testutils.CheckRunsForRefPayload)
		checkRunsURL := &githubCheckRunsServer.URL
		defer githubCheckRunsServer.Close()

		githubCheckRuns, err := listCheckRunsForCommit(ctx, githubClient, repository, pullRequest, checkRunsURL)

		assert.NoError(t, err)
		assert.Equal(t, 1, *githubCheckRuns.Total)
		assert.Equal(t, 1, len(githubCheckRuns.CheckRuns))
		assert.Equal(t, int64(96024), *githubCheckRuns.CheckRuns[0].ID)
	})
	t.Run("BadStatusCode", func(t *testing.T) {
		githubCheckRunsServer := testutils.GetMockAPIServer(t, 503, testutils.CheckRunsForRefPayload)
		checkRunsURL := &githubCheckRunsServer.URL
		defer githubCheckRunsServer.Close()

		githubCheckRuns, err := listCheckRunsForCommit(ctx, githubClient, repository, pullRequest, checkRunsURL)

		assert.Error(t, err)
		assert.Equal(t, fmt.Sprintf("GET %s/repos/chad1616/ExampleRepository/commits/abc123/check-runs: 503  []", *checkRunsURL), err.Error())
		assert.Nil(t, githubCheckRuns)
	})
	t.Run("BadResponse", func(t *testing.T) {
		githubCheckRunsServer := testutils.GetMockAPIServer(t, 200, "oopsie")
		checkRunsURL := &githubCheckRunsServer.URL
		defer githubCheckRunsServer.Close()

		githubCheckRuns, err := listCheckRunsForCommit(ctx, githubClient, repository, pullRequest, checkRunsURL)

		assert.Error(t, err)
		assert.Equal(t, "invalid character 'o' looking for beginning of value", err.Error())
		assert.Nil(t, githubCheckRuns)
	})
}

func TestUserIsReviewer(t *testing.T) {
	testGithubUser1 := &github.User{
		ID: github.Int64(1),
	}
	testGithubUser2 := &github.User{
		ID: github.Int64(2),
	}
	githubPullRequest := &github.PullRequest{
		RequestedReviewers: []*github.User{testGithubUser1},
	}
	t.Run("UserIsReviewer", func(t *testing.T) {
		assert.True(t, userIsReviewer(testGithubUser1, githubPullRequest))
	})
	t.Run("UserIsNotReviewer", func(t *testing.T) {
		assert.False(t, userIsReviewer(testGithubUser2, githubPullRequest))
	})
	t.Run("NilPullRequest", func(t *testing.T) {
		assert.False(t, userIsReviewer(testGithubUser1, nil))
	})
	t.Run("NilUser", func(t *testing.T) {
		assert.False(t, userIsReviewer(nil, githubPullRequest))
	})
	t.Run("NilFields", func(t *testing.T) {
		testGithubUser1.ID = nil
		assert.False(t, userIsReviewer(testGithubUser1, githubPullRequest))
	})
}

func TestPullRequestIsApproved(t *testing.T) {
	t.Run("PullRequestIsApproved", func(t *testing.T) {
		assert.True(t, pullRequestIsApproved([]*github.PullRequestReview{
			{State: github.String("APPROVED")},
			{State: github.String("CHECKSUM_FAILED")},
			{State: github.String("COMMENTED")},
			{State: nil},
		}))
	})
	t.Run("PullRequestIsNotApproved", func(t *testing.T) {
		assert.False(t, pullRequestIsApproved([]*github.PullRequestReview{
			{State: github.String("CHECKSUM_FAILED")},
			{State: github.String("COMMENTED")},
			{State: nil},
		}))
	})
}

func TestCommentCount(t *testing.T) {
	context := context.Background()
	githubClient := github.NewClient(nil)
	repository := &github.Repository{
		Name: github.String("ExampleRepository"),
		Owner: &github.User{
			Login: github.String("chad1616"),
		},
	}
	pullRequest := &github.PullRequest{
		Number: github.Int(1),
	}

	t.Run("SingleListComment", func(t *testing.T) {
		githubCommentsServer := testutils.GetMockAPIServer(t, 200, testutils.PullRequestCommentsPayload)
		commentsURL := &githubCommentsServer.URL
		defer githubCommentsServer.Close()

		githubIssueCommentsServer := testutils.GetMockAPIServer(t, 200, `[]`)
		issueCommentsURL := &githubIssueCommentsServer.URL
		defer githubCommentsServer.Close()

		reviews := []*github.PullRequestReview{}
		count, err := getCommentCount(context, githubClient, repository, pullRequest, reviews, commentsURL, issueCommentsURL)

		assert.NoError(t, err)
		assert.Equal(t, 1, count)
	})
	t.Run("SingleIssueComment", func(t *testing.T) {
		githubCommentsServer := testutils.GetMockAPIServer(t, 200, `[]`)
		commentsURL := &githubCommentsServer.URL
		defer githubCommentsServer.Close()

		githubIssueCommentsServer := testutils.GetMockAPIServer(t, 200, testutils.IssueCommentPayload)
		issueCommentsURL := &githubIssueCommentsServer.URL
		defer githubCommentsServer.Close()

		reviews := []*github.PullRequestReview{}
		count, err := getCommentCount(context, githubClient, repository, pullRequest, reviews, commentsURL, issueCommentsURL)

		assert.NoError(t, err)
		assert.Equal(t, 1, count)
	})
	t.Run("SingleReviewComment", func(t *testing.T) {
		githubCommentsServer := testutils.GetMockAPIServer(t, 200, `[]`)
		commentsURL := &githubCommentsServer.URL
		defer githubCommentsServer.Close()

		githubIssueCommentsServer := testutils.GetMockAPIServer(t, 200, `[]`)
		issueCommentsURL := &githubIssueCommentsServer.URL
		defer githubCommentsServer.Close()

		reviews := []*github.PullRequestReview{{
			Body: github.String("This is a review comment"),
		}}
		count, err := getCommentCount(context, githubClient, repository, pullRequest, reviews, commentsURL, issueCommentsURL)

		assert.NoError(t, err)
		assert.Equal(t, 1, count)
	})
	t.Run("ComboComments", func(t *testing.T) {
		githubCommentsServer := testutils.GetMockAPIServer(t, 200, testutils.PullRequestCommentsPayload)
		commentsURL := &githubCommentsServer.URL
		defer githubCommentsServer.Close()

		githubIssueCommentsServer := testutils.GetMockAPIServer(t, 200, testutils.IssueCommentPayload)
		issueCommentsURL := &githubIssueCommentsServer.URL
		defer githubCommentsServer.Close()

		reviews := []*github.PullRequestReview{{
			Body: github.String("This is a review comment"),
		}}
		count, err := getCommentCount(context, githubClient, repository, pullRequest, reviews, commentsURL, issueCommentsURL)

		assert.NoError(t, err)
		assert.Equal(t, 3, count)
	})
	t.Run("BadStatusCode", func(t *testing.T) {
		githubCommentsServer := testutils.GetMockAPIServer(t, 503, "[]")
		commentsURL := &githubCommentsServer.URL
		defer githubCommentsServer.Close()

		githubIssueCommentsServer := testutils.GetMockAPIServer(t, 503, "[]")
		issueCommentsURL := &githubIssueCommentsServer.URL
		defer githubCommentsServer.Close()

		reviews := []*github.PullRequestReview{{
			Body: github.String("This is a review comment"),
		}}
		count, err := getCommentCount(context, githubClient, repository, pullRequest, reviews, commentsURL, issueCommentsURL)

		assert.Error(t, err)
		assert.Equal(t, fmt.Sprintf("GET %s/repos/chad1616/ExampleRepository/pulls/1/comments: 503  []", *commentsURL), err.Error())
		assert.Zero(t, count)
	})
	t.Run("BadResponse", func(t *testing.T) {
		githubCommentsServer := testutils.GetMockAPIServer(t, 200, "oopsie")
		commentsURL := &githubCommentsServer.URL
		defer githubCommentsServer.Close()

		githubIssueCommentsServer := testutils.GetMockAPIServer(t, 200, "oopsie")
		issueCommentsURL := &githubIssueCommentsServer.URL
		defer githubCommentsServer.Close()

		reviews := []*github.PullRequestReview{{
			Body: github.String("This is a review comment"),
		}}
		count, err := getCommentCount(context, githubClient, repository, pullRequest, reviews, commentsURL, issueCommentsURL)

		assert.Error(t, err)
		assert.Equal(t, "invalid character 'o' looking for beginning of value", err.Error())
		assert.Zero(t, count)
	})
	t.Run("RepositoryIsNil", func(t *testing.T) {
		reviews := []*github.PullRequestReview{}
		count, err := getCommentCount(context, githubClient, nil, pullRequest, reviews, nil, nil)

		assert.Error(t, err)
		assert.Equal(t, "repository is nil", err.Error())
		assert.Equal(t, 0, count)
	})
	t.Run("PullRequestIsNil", func(t *testing.T) {
		reviews := []*github.PullRequestReview{}
		count, err := getCommentCount(context, githubClient, repository, nil, reviews, nil, nil)

		assert.Error(t, err)
		assert.Equal(t, "pull request is nil", err.Error())
		assert.Equal(t, 0, count)
	})
}

func TestGetReviewerCount(t *testing.T) {
	context := context.Background()
	githubClient := github.NewClient(nil)

	repository := &github.Repository{
		Name: github.String("ExampleRepository"),
		Owner: &github.User{
			Login: github.String("chad1616"),
		},
	}
	pullRequest := &github.PullRequest{
		Number: github.Int(1),
		Head: &github.PullRequestBranch{
			SHA: github.String("abc123"),
		},
	}
	t.Run("SingleListReview", func(t *testing.T) {
		githubReviewersServer := testutils.GetMockAPIServer(t, 200, testutils.PullRequestReviewersPayload)
		reviewersURL := &githubReviewersServer.URL
		defer githubReviewersServer.Close()

		reviews := []*github.PullRequestReview{}
		reviewerCount, err := getReviewerCount(context, githubClient, repository, pullRequest, reviews, reviewersURL)

		assert.NoError(t, err)
		assert.Equal(t, 1, reviewerCount)
	})
	t.Run("SingleSubmittedReview", func(t *testing.T) {
		githubReviewersServer := testutils.GetMockAPIServer(t, 200, `{}`)
		reviewersURL := &githubReviewersServer.URL
		defer githubReviewersServer.Close()

		reviews := []*github.PullRequestReview{{
			User: &github.User{
				ID: github.Int64(1),
			},
			State: github.String("APPROVED"),
		}}
		reviewerCount, err := getReviewerCount(context, githubClient, repository, pullRequest, reviews, reviewersURL)

		assert.NoError(t, err)
		assert.Equal(t, 1, reviewerCount)
	})
	t.Run("ComboReviews", func(t *testing.T) {
		githubReviewersServer := testutils.GetMockAPIServer(t, 200, testutils.PullRequestReviewersPayload)
		reviewersURL := &githubReviewersServer.URL
		defer githubReviewersServer.Close()

		reviews := []*github.PullRequestReview{{
			User: &github.User{
				ID: github.Int64(1),
			},
			State: github.String("APPROVED"),
		}}
		reviewerCount, err := getReviewerCount(context, githubClient, repository, pullRequest, reviews, reviewersURL)

		assert.NoError(t, err)
		assert.Equal(t, 2, reviewerCount)
	})
	t.Run("BadStatusCode", func(t *testing.T) {
		githubReviewersServer := testutils.GetMockAPIServer(t, 503, "{}")
		reviewersURL := &githubReviewersServer.URL
		defer githubReviewersServer.Close()

		reviews := []*github.PullRequestReview{}
		reviewerCount, err := getReviewerCount(context, githubClient, repository, pullRequest, reviews, reviewersURL)

		assert.Error(t, err)
		assert.Equal(t, fmt.Sprintf("GET %s/repos/chad1616/ExampleRepository/pulls/1/requested_reviewers: 503  []", *reviewersURL), err.Error())
		assert.Zero(t, reviewerCount)
	})
	t.Run("BadResponse", func(t *testing.T) {
		githubReviewersServer := testutils.GetMockAPIServer(t, 200, "oopsie")
		reviewersURL := &githubReviewersServer.URL
		defer githubReviewersServer.Close()

		reviews := []*github.PullRequestReview{}
		reviewerCount, err := getReviewerCount(context, githubClient, repository, pullRequest, reviews, reviewersURL)

		assert.Error(t, err)
		assert.Equal(t, "invalid character 'o' looking for beginning of value", err.Error())
		assert.Zero(t, reviewerCount)
	})
	t.Run("RepositoryIsNil", func(t *testing.T) {
		reviews := []*github.PullRequestReview{}
		reviewerCount, err := getReviewerCount(context, githubClient, nil, pullRequest, reviews, nil)

		assert.Error(t, err)
		assert.Equal(t, "repository is nil", err.Error())
		assert.Equal(t, 0, reviewerCount)
	})
	t.Run("PullRequestIsNil", func(t *testing.T) {
		reviews := []*github.PullRequestReview{}
		reviewerCount, err := getReviewerCount(context, githubClient, repository, nil, reviews, nil)

		assert.Error(t, err)
		assert.Equal(t, "pull request is nil", err.Error())
		assert.Equal(t, 0, reviewerCount)
	})
}

func TestReviewersHaveRequestedChanges(t *testing.T) {
	t.Run("NoReviews", func(t *testing.T) {
		pullRequestReviews := []*github.PullRequestReview{}
		reviewersHaveRequestedChanges := reviewersHaveRequestedChanges(pullRequestReviews)

		assert.False(t, reviewersHaveRequestedChanges)
	})
	t.Run("SingleApprovalReview", func(t *testing.T) {
		pullRequestReviews := []*github.PullRequestReview{
			{
				User: &github.User{
					Login: github.String("testUser"),
				},
				State: github.String("APPROVED"),
			},
		}
		reviewersHaveRequestedChanges := reviewersHaveRequestedChanges(pullRequestReviews)

		assert.False(t, reviewersHaveRequestedChanges)
	})
	t.Run("PreviousRequestedChanges", func(t *testing.T) {
		pullRequestReviews := []*github.PullRequestReview{
			{
				User: &github.User{
					Login: github.String("testUser"),
				},
				State: github.String("REQUESTED_CHANGES"),
			},
			{
				User: &github.User{
					Login: github.String("testUser"),
				},
				State: github.String("APPROVED"),
			},
		}
		reviewersHaveRequestedChanges := reviewersHaveRequestedChanges(pullRequestReviews)

		assert.False(t, reviewersHaveRequestedChanges)
	})
	t.Run("RequestedChanges", func(t *testing.T) {
		pullRequestReviews := []*github.PullRequestReview{
			{
				User: &github.User{
					Login: github.String("testUser"),
				},
				State: github.String("APPROVED"),
			},
			{
				User: &github.User{
					Login: github.String("testUser"),
				},
				State: github.String("CHANGES_REQUESTED"),
			},
		}
		reviewersHaveRequestedChanges := reviewersHaveRequestedChanges(pullRequestReviews)

		assert.True(t, reviewersHaveRequestedChanges)
	})
	t.Run("MultupleUserStates", func(t *testing.T) {
		pullRequestReviews := []*github.PullRequestReview{
			{
				User: &github.User{
					Login: github.String("testUser2"),
				},
				State: github.String("CHANGES_REQUESTED"),
			},
			{
				User: &github.User{
					Login: github.String("testUser1"),
				},
				State: github.String("APPROVED"),
			},
		}
		reviewersHaveRequestedChanges := reviewersHaveRequestedChanges(pullRequestReviews)

		assert.True(t, reviewersHaveRequestedChanges)
	})
}

func TestChecksDidFail(t *testing.T) {
	context := context.Background()
	githubClient := github.NewClient(nil)

	repository := &github.Repository{
		Name: github.String("ExampleRepository"),
		Owner: &github.User{
			Login: github.String("chad1616"),
		},
	}
	pullRequest := &github.PullRequest{
		Number: github.Int(1),
		Head: &github.PullRequestBranch{
			SHA: github.String("abc123"),
		},
	}
	t.Run("ChecksPass", func(t *testing.T) {
		githubCheckRunsServer := testutils.GetMockAPIServer(t, 200, testutils.CheckRunsForRefPayload)
		checkRunsURL := &githubCheckRunsServer.URL
		defer githubCheckRunsServer.Close()

		conclusion, err := checksDidFail(context, githubClient, repository, pullRequest, checkRunsURL)
		assert.NoError(t, err)
		assert.False(t, conclusion)
	})
	t.Run("ChecksFail", func(t *testing.T) {
		githubCheckRunsServer := testutils.GetMockAPIServer(t, 200, testutils.CheckRunsForRefFailPayload)
		checkRunsURL := &githubCheckRunsServer.URL
		defer githubCheckRunsServer.Close()

		conclusion, err := checksDidFail(context, githubClient, repository, pullRequest, checkRunsURL)
		assert.NoError(t, err)
		assert.True(t, conclusion)
	})
	t.Run("BadStatusCode", func(t *testing.T) {
		githubCheckRunsServer := testutils.GetMockAPIServer(t, 503, "[]")
		checkRunsURL := &githubCheckRunsServer.URL
		defer githubCheckRunsServer.Close()

		conclusion, err := checksDidFail(context, githubClient, repository, pullRequest, checkRunsURL)
		assert.Error(t, err)
		assert.Equal(t, fmt.Sprintf("GET %s/repos/chad1616/ExampleRepository/commits/abc123/check-runs: 503  []", *checkRunsURL), err.Error())
		assert.False(t, conclusion)
	})
	t.Run("BadResponse", func(t *testing.T) {
		githubCheckRunsServer := testutils.GetMockAPIServer(t, 200, "oopsie")
		checkRunsURL := &githubCheckRunsServer.URL
		defer githubCheckRunsServer.Close()

		conclusion, err := checksDidFail(context, githubClient, repository, pullRequest, checkRunsURL)
		assert.Error(t, err)
		assert.Equal(t, "invalid character 'o' looking for beginning of value", err.Error())
		assert.False(t, conclusion)
	})
	t.Run("RepositoryIsNil", func(t *testing.T) {
		conclusion, err := checksDidFail(context, githubClient, nil, pullRequest, nil)
		assert.Error(t, err)
		assert.Equal(t, "repository is nil", err.Error())
		assert.False(t, conclusion)
	})
	t.Run("PullRequestIsNil", func(t *testing.T) {
		conclusion, err := checksDidFail(context, githubClient, repository, nil, nil)

		assert.Error(t, err)
		assert.Equal(t, "pull request is nil", err.Error())
		assert.False(t, conclusion)
	})
}

func TestGetPullRequestRequiredAction(t *testing.T) {
	t.Run("AddReviewers", func(t *testing.T) {
		pullRequestData := GithubPRData{
			RequestedReviewers: 0,
			IsMergeable:        true,
		}
		action := getPullRequestRequiredAction(pullRequestData)

		assert.Equal(t, "Add Reviewers", action)
	})
	t.Run("FixMergeConflicts", func(t *testing.T) {
		pullRequestData := GithubPRData{
			RequestedReviewers: 1,
			IsMergeable:        false,
		}
		action := getPullRequestRequiredAction(pullRequestData)

		assert.Equal(t, "Fix Merge Conflicts", action)
	})
	t.Run("FixFailedCI", func(t *testing.T) {
		pullRequestData := GithubPRData{
			RequestedReviewers: 1,
			IsMergeable:        true,
			ChecksDidFail:      true,
		}
		action := getPullRequestRequiredAction(pullRequestData)

		assert.Equal(t, "Fix Failed CI", action)
	})
	t.Run("AddressRequestedChanges", func(t *testing.T) {
		pullRequestData := GithubPRData{
			RequestedReviewers:   1,
			IsMergeable:          true,
			ChecksDidFail:        false,
			HaveRequestedChanges: true,
		}
		action := getPullRequestRequiredAction(pullRequestData)

		assert.Equal(t, "Address Requested Changes", action)
	})
	t.Run("MergePR", func(t *testing.T) {
		pullRequestData := GithubPRData{
			RequestedReviewers:   1,
			IsMergeable:          true,
			ChecksDidFail:        false,
			HaveRequestedChanges: false,
			IsApproved:           true,
		}
		action := getPullRequestRequiredAction(pullRequestData)

		assert.Equal(t, "Merge PR", action)
	})
	t.Run("WaitingOnReview", func(t *testing.T) {
		pullRequestData := GithubPRData{
			RequestedReviewers:   1,
			IsMergeable:          true,
			ChecksDidFail:        false,
			HaveRequestedChanges: false,
			IsApproved:           false,
		}
		action := getPullRequestRequiredAction(pullRequestData)

		assert.Equal(t, "Waiting on Review", action)
	})
	t.Run("FixMergeConflictsIsTopPriority", func(t *testing.T) {
		// make all lower priority conditions true to verify proper priority
		pullRequestData := GithubPRData{
			RequestedReviewers:   0,
			IsMergeable:          false,
			ChecksDidFail:        true,
			HaveRequestedChanges: true,
			IsApproved:           true,
		}
		action := getPullRequestRequiredAction(pullRequestData)

		assert.Equal(t, "Fix Merge Conflicts", action)
	})
	t.Run("ChecksDidFailIsSecondPriority", func(t *testing.T) {
		// make all lower priority conditions true to verify proper priority
		pullRequestData := GithubPRData{
			RequestedReviewers:   0,
			IsMergeable:          true,
			ChecksDidFail:        true,
			HaveRequestedChanges: true,
			IsApproved:           true,
		}
		action := getPullRequestRequiredAction(pullRequestData)

		assert.Equal(t, "Fix Failed CI", action)
	})
	t.Run("AddReviewersIsThirdPriority", func(t *testing.T) {
		// make all lower priority conditions true to verify proper priority
		pullRequestData := GithubPRData{
			RequestedReviewers:   0,
			IsMergeable:          true,
			ChecksDidFail:        false,
			HaveRequestedChanges: true,
			IsApproved:           true,
		}
		action := getPullRequestRequiredAction(pullRequestData)

		assert.Equal(t, "Add Reviewers", action)
	})
	t.Run("AddressRequestedChangesIsFourthPriority", func(t *testing.T) {
		// make all lower priority conditions true to verify proper priority
		pullRequestData := GithubPRData{
			RequestedReviewers:   1,
			IsMergeable:          true,
			ChecksDidFail:        false,
			HaveRequestedChanges: true,
			IsApproved:           true,
		}
		action := getPullRequestRequiredAction(pullRequestData)

		assert.Equal(t, "Address Requested Changes", action)
	})
}
