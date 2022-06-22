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
	t.Run("WithoutOverrideURL", func(t *testing.T) {
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
	t.Run("SuccessWithOverrideURL", func(t *testing.T) {
		githubUserServer := testutils.GetMockAPIServer(t, 200, testutils.UserResponsePayload)
		userURL := &githubUserServer.URL
		defer githubUserServer.Close()
		ctx := context.Background()
		githubClient := github.NewClient(nil)
		githubUser, err := getGithubUser(ctx, githubClient, "", userURL)

		assert.NoError(t, err)
		assert.Equal(t, *githubUser.Login, "chad1616")
	})
	t.Run("FailureWithoutOverrideURL", func(t *testing.T) {
		ctx := context.Background()
		githubClient := github.NewClient(nil)
		githubUser, err := getGithubUser(ctx, githubClient, "", nil)

		assert.Error(t, err)
		assert.Equal(t, "GET https://api.github.com/user: 401 Requires authentication []", err.Error())
		assert.Nil(t, githubUser)
	})
}

func TestGithubRepositories(t *testing.T) {
	t.Run("SuccessWithOverrideURL", func(t *testing.T) {
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
	t.Run("FailureWithoutOverrideURL", func(t *testing.T) {
		ctx := context.Background()
		githubClient := github.NewClient(nil)
		githubRepositories, err := getGithubRepositories(ctx, githubClient, "", nil)

		assert.Error(t, err)
		assert.Equal(t, "GET https://api.github.com/user/repos: 401 Requires authentication []", err.Error())
		assert.Nil(t, githubRepositories)
	})
}

func TestGithubPullRequests(t *testing.T) {
	t.Run("SuccessWithOverrideURL", func(t *testing.T) {
		githubUserPullRequestsServer := testutils.GetMockAPIServer(t, 200, testutils.UserPullRequestsPayload)
		userPullRequestsURL := &githubUserPullRequestsServer.URL
		defer githubUserPullRequestsServer.Close()
		ctx := context.Background()
		githubClient := github.NewClient(nil)

		repository := &github.Repository{
			Name: github.String("ExampleRepository"),
			Owner: &github.User{
				Login: github.String("chad1616"),
			},
		}

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
		assert.Equal(t, "failed: repository is nil", err.Error())
		assert.Nil(t, githubPullRequests)
	})
	t.Run("FailureWithoutOverrideURL", func(t *testing.T) {
		ctx := context.Background()
		githubClient := github.NewClient(nil)
		repository := &github.Repository{
			Name: github.String("ExampleRepository"),
			Owner: &github.User{
				Login: github.String("chad1616"),
			},
		}
		githubPullRequests, err := getGithubPullRequests(ctx, githubClient, repository, nil)

		assert.Error(t, err)
		assert.Equal(t, "GET https://api.github.com/repos/chad1616/ExampleRepository/pulls: 404 Not Found []", err.Error())
		assert.Nil(t, githubPullRequests)
	})
}

func TestListReviewers(t *testing.T) {
	t.Run("SuccessWithoverrideURL", func(t *testing.T) {
		githubReviewersServer := testutils.GetMockAPIServer(t, 200, testutils.PullRequestReviewersPayload)
		reviewersURL := &githubReviewersServer.URL
		defer githubReviewersServer.Close()
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
		githubReviewers, err := listReviewers(ctx, githubClient, repository, pullRequest, reviewersURL)

		assert.NoError(t, err)
		assert.Equal(t, 1, len(githubReviewers.Users))
		assert.Equal(t, "goodTeamMember", *githubReviewers.Users[0].Login)
	})
	t.Run("FailureWithNilRepository", func(t *testing.T) {
		ctx := context.Background()
		githubClient := github.NewClient(nil)
		pullRequest := &github.PullRequest{
			Number: github.Int(1),
		}
		githubReviewers, err := listReviewers(ctx, githubClient, nil, pullRequest, nil)

		assert.Error(t, err)
		assert.Equal(t, "failed: repository is nil", err.Error())
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
		assert.Equal(t, "failed: pull request is nil", err.Error())
		assert.Nil(t, githubReviewers)
	})
	t.Run("FailureWithoutOverrideURL", func(t *testing.T) {
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
		githubReviewers, err := listReviewers(ctx, githubClient, repository, pullRequest, nil)

		assert.Error(t, err)
		assert.Equal(t, "GET https://api.github.com/repos/chad1616/ExampleRepository/pulls/1/requested_reviewers: 404 Not Found []", err.Error())
		assert.Nil(t, githubReviewers)
	})
}

func TestListComments(t *testing.T) {
	t.Run("SuccessWithOverrideURL", func(t *testing.T) {
		githubCommentsServer := testutils.GetMockAPIServer(t, 200, testutils.PullRequestCommentsPayload)
		commentsURL := &githubCommentsServer.URL
		defer githubCommentsServer.Close()
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
		githubComments, err := listComments(ctx, githubClient, repository, pullRequest, commentsURL)

		assert.NoError(t, err)
		assert.Equal(t, 1, len(githubComments))
		assert.Equal(t, "chad1616", *githubComments[0].User.Login)
	})
}

func TestCheckRunsForRef(t *testing.T) {
	t.Run("SuccessWithOverrideURL", func(t *testing.T) {
		githubCheckRunsServer := testutils.GetMockAPIServer(t, 200, testutils.CheckRunsForRefPayload)
		checkRunsURL := &githubCheckRunsServer.URL
		defer githubCheckRunsServer.Close()
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
		githubCheckRuns, err := listCheckRunsForRef(ctx, githubClient, repository, pullRequest, checkRunsURL)

		assert.NoError(t, err)
		assert.Equal(t, 1, *githubCheckRuns.Total)
		assert.Equal(t, 1, len(githubCheckRuns.CheckRuns))
		assert.Equal(t, int64(96024), *githubCheckRuns.CheckRuns[0].ID)
	})
}

func TestUserIsOwner(t *testing.T) {
	testGithubUser1 := &github.User{
		ID: github.Int64(1),
	}
	testGithubUser2 := &github.User{
		ID: github.Int64(2),
	}
	testGithubUser3 := &github.User{
		ID: nil,
	}
	pullRequestUser1 := &github.PullRequest{
		User: testGithubUser1,
	}
	pullRequestUser3 := &github.PullRequest{
		User: testGithubUser3,
	}

	t.Run("UserIsOwner", func(t *testing.T) {
		assert.True(t, userIsOwner(testGithubUser1, pullRequestUser1))
	})
	t.Run("UserIsNotOwner", func(t *testing.T) {
		assert.False(t, userIsOwner(testGithubUser2, pullRequestUser1))
	})
	t.Run("UserIdIsNil", func(t *testing.T) {
		assert.False(t, userIsOwner(testGithubUser3, pullRequestUser1))
	})
	t.Run("PullRequestUserIdIsNil", func(t *testing.T) {
		assert.False(t, userIsOwner(testGithubUser1, pullRequestUser3))
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
}

func TestPullRequestIsApproved(t *testing.T) {
	approvedReviews := []*github.PullRequestReview{
		{
			State: github.String("APPROVED"),
		},
		{
			State: github.String("CHECKSUM_FAILED"),
		},
		{
			State: github.String("COMMENTED"),
		},
	}
	notApprovedReviews := []*github.PullRequestReview{
		{
			State: github.String("CHECKSUM_FAILED"),
		},
		{
			State: github.String("COMMENTED"),
		},
	}
	t.Run("PullRequestIsApproved", func(t *testing.T) {
		assert.True(t, pullRequestIsApproved(approvedReviews))
	})
	t.Run("PullRequestIsNotApproved", func(t *testing.T) {
		assert.False(t, pullRequestIsApproved(notApprovedReviews))
	})
}

func TestGetReviewerCount(t *testing.T) {
	t.Run("SingleListReview", func(t *testing.T) {
		githubReviewersServer := testutils.GetMockAPIServer(t, 200, testutils.PullRequestReviewersPayload)
		reviewersURL := &githubReviewersServer.URL
		defer githubReviewersServer.Close()
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
		reviews := []*github.PullRequestReview{}
		reviewerCount, err := getReviewerCount(context, githubClient, repository, pullRequest, reviews, reviewersURL)

		assert.NoError(t, err)
		assert.Equal(t, 1, reviewerCount)
	})
	t.Run("SingleSubmittedReview", func(t *testing.T) {
		githubReviewersServer := testutils.GetMockAPIServer(t, 200, `{}`)
		reviewersURL := &githubReviewersServer.URL
		defer githubReviewersServer.Close()
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
	t.Run("RepositoryIsNil", func(t *testing.T) {
		context := context.Background()
		githubClient := github.NewClient(nil)
		pullRequest := &github.PullRequest{
			Number: github.Int(1),
			Head: &github.PullRequestBranch{
				SHA: github.String("abc123"),
			},
		}
		reviews := []*github.PullRequestReview{}
		reviewerCount, err := getReviewerCount(context, githubClient, nil, pullRequest, reviews, nil)

		assert.Error(t, err)
		assert.Equal(t, "failed: repository is nil", err.Error())
		assert.Equal(t, 0, reviewerCount)
	})
	t.Run("PullRequestIsNil", func(t *testing.T) {
		context := context.Background()
		githubClient := github.NewClient(nil)
		repository := &github.Repository{
			Name: github.String("ExampleRepository"),
			Owner: &github.User{
				Login: github.String("chad1616"),
			},
		}
		reviews := []*github.PullRequestReview{}
		reviewerCount, err := getReviewerCount(context, githubClient, repository, nil, reviews, nil)

		assert.Error(t, err)
		assert.Equal(t, "failed: pull request is nil", err.Error())
		assert.Equal(t, 0, reviewerCount)
	})
}
