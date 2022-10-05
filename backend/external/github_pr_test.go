package external

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/testutils"
	"github.com/google/go-github/v45/github"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
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
		err := githubSource.ModifyTask(nil, userID, "sample_account@email.com", "6942069420", &database.Task{IsCompleted: &isCompleted}, nil)
		assert.NoError(t, err)
	})
}

func TestGetPullRequests(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	repositoryCollection := database.GetRepositoryCollection(db)
	expectedRepository := database.Repository{
		FullName:     "dankmemes/ExampleRepository",
		RepositoryID: "1234",
	}

	githubCompareServer := testutils.GetMockAPIServer(t, 200, testutils.CompareResponsePayload)
	compareURL := &githubCompareServer.URL
	defer githubCompareServer.Close()

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

	githubPullRequestReviewServer := testutils.GetMockAPIServer(t, 200, `[]`)
	pullRequestReviewURL := &githubPullRequestReviewServer.URL
	defer githubPullRequestReviewServer.Close()

	githubListCheckRunsForRefServer := testutils.GetMockAPIServer(t, 200, testutils.EmptyCheckRunsForRefPayload)
	listCheckRunsForRefURL := &githubListCheckRunsForRefServer.URL
	defer githubListCheckRunsForRefServer.Close()

	githubListPullRequestCommentsServer := testutils.GetMockAPIServer(t, 200, testutils.PullRequestCommentsPayload)
	listPullRequestCommentsURL := &githubListPullRequestCommentsServer.URL
	defer githubListPullRequestCommentsServer.Close()

	githubListIssueCommentsServer := testutils.GetMockAPIServer(t, 200, `[]`)
	listIssueCommentsURL := &githubListIssueCommentsServer.URL
	defer githubListIssueCommentsServer.Close()

	githubListUserTeamsServer := testutils.GetMockAPIServer(t, 200, `[]`)
	listUserTeamsURL := &githubListUserTeamsServer.URL
	defer githubListUserTeamsServer.Close()

	githubPullRequestModifiedServer := testutils.GetMockAPIServer(t, 200, ``)
	pullRequestModifiedURL := &githubPullRequestModifiedServer.URL
	defer githubPullRequestModifiedServer.Close()

	fetchExternalAPITokenValue := false
	githubPR := GithubPRSource{
		Github: GithubService{
			Config: GithubConfig{
				ConfigValues: GithubConfigValues{
					FetchExternalAPIToken:       &fetchExternalAPITokenValue,
					CompareURL:                  compareURL,
					GetUserURL:                  userURL,
					ListRepositoriesURL:         userRepositoriesURL,
					ListPullRequestsURL:         userPullRequestsURL,
					ListPullRequestCommentsURL:  listPullRequestCommentsURL,
					ListIssueCommentsURL:        listIssueCommentsURL,
					ListPullRequestReviewURL:    pullRequestReviewURL,
					ListPullRequestReviewersURL: pullRequestReviewersURL,
					ListCheckRunsForRefURL:      listCheckRunsForRefURL,
					ListUserTeamsURL:            listUserTeamsURL,
					PullRequestModifiedURL:      pullRequestModifiedURL,
				},
			},
		},
	}

	t.Run("Success", func(t *testing.T) {
		userId := primitive.NewObjectID()

		var pullRequests = make(chan PullRequestResult)
		go githubPR.GetPullRequests(db, userId, "exampleAccountID", pullRequests)
		result := <-pullRequests

		assert.NoError(t, result.Error)
		assert.Equal(t, len(result.PullRequests), 1)
		pullRequest := result.PullRequests[0]
		assert.Equal(t, ActionAddReviewers, pullRequest.RequiredAction)
		assert.Equal(t, "the oopsie must be fixed", pullRequest.Body)
		expectedCreatedAt, _ := time.Parse(time.RFC3339, "2011-01-26T19:01:12Z") //2011-01-26T19:01:12Z
		expectedComments := []database.PullRequestComment{{
			Type:            constants.COMMENT_TYPE_INLINE,
			Body:            "This is a comment",
			Author:          "chad1616",
			Filepath:        "tothemoon.txt",
			LineNumberStart: 69,
			LineNumberEnd:   420,
			CreatedAt:       primitive.NewDateTimeFromTime(expectedCreatedAt),
		}}
		assert.Equal(t, expectedComments, pullRequest.Comments)
		assert.Equal(t, 93, pullRequest.Additions)
		assert.Equal(t, 462, pullRequest.Deletions)

		// Check that repository for PR is created in the database
		var repository database.Repository
		repositoryCollection.FindOne(context.Background(), bson.M{"user_id": userId}, nil).Decode(&repository)
		assert.Equal(t, expectedRepository.FullName, repository.FullName)
		assert.Equal(t, expectedRepository.RepositoryID, repository.RepositoryID)
	})
	t.Run("SuccessNotRelevantPR", func(t *testing.T) {
		userId := primitive.NewObjectID()

		githubUserNotRelevantPullRequestsServer := testutils.GetMockAPIServer(t, 200, testutils.UserNotRelevantPullRequestsPayload)
		userNotRelevantPullRequestsURL := &githubUserNotRelevantPullRequestsServer.URL
		defer githubUserNotRelevantPullRequestsServer.Close()
		githubPR.Github.Config.ConfigValues.ListPullRequestsURL = userNotRelevantPullRequestsURL

		var pullRequests = make(chan PullRequestResult)
		go githubPR.GetPullRequests(db, userId, "exampleAccountID", pullRequests)
		result := <-pullRequests

		assert.NoError(t, result.Error)
		assert.Equal(t, len(result.PullRequests), 1)
		assert.Equal(t, ActionNoneNeeded, result.PullRequests[0].RequiredAction)

		// Check that repository for PR is created in the database
		var repository database.Repository
		repositoryCollection.FindOne(context.Background(), bson.M{"user_id": userId}, nil).Decode(&repository)
		assert.Equal(t, expectedRepository.FullName, repository.FullName)
		assert.Equal(t, expectedRepository.RepositoryID, repository.RepositoryID)

		githubPR.Github.Config.ConfigValues.ListPullRequestsURL = userPullRequestsURL
	})
	t.Run("SuccessConditionalRequest", func(t *testing.T) {
		userID := primitive.NewObjectID()

		pullRequestCollection := database.GetPullRequestCollection(db)
		falseBool := false
		// wrong id_external
		_, err := pullRequestCollection.InsertOne(context.Background(), database.PullRequest{
			UserID:      userID,
			IDExternal:  "oh no oopsie",
			IsCompleted: &falseBool,
		})
		assert.NoError(t, err)
		// wrong user_id
		_, err = pullRequestCollection.InsertOne(context.Background(), database.PullRequest{
			UserID:      primitive.NewObjectID(),
			IDExternal:  "oh no oopsie",
			IsCompleted: &falseBool,
		})
		assert.NoError(t, err)
		// correct values to find in DB
		_, err = pullRequestCollection.InsertOne(context.Background(), database.PullRequest{
			UserID:      userID,
			IDExternal:  "1",
			IsCompleted: &falseBool,
			Title:       "something cached in the db",
		})
		assert.NoError(t, err)

		githubPullRequestNotModifiedServer := testutils.GetMockAPIServer(t, 304, ``)
		pullRequestNotModifiedURL := &githubPullRequestNotModifiedServer.URL
		defer githubPullRequestNotModifiedServer.Close()
		githubPR.Github.Config.ConfigValues.PullRequestModifiedURL = pullRequestNotModifiedURL

		var pullRequests = make(chan PullRequestResult)
		go githubPR.GetPullRequests(db, userID, "exampleAccountID", pullRequests)
		result := <-pullRequests

		assert.NoError(t, result.Error)
		assert.Equal(t, 1, len(result.PullRequests))
		// if it fetched from the proper API, it wouldn't still have this title
		assert.Equal(t, "something cached in the db", result.PullRequests[0].Title)

		// run it again now with a "has been modified" server response
		githubPR.Github.Config.ConfigValues.PullRequestModifiedURL = pullRequestModifiedURL

		pullRequests = make(chan PullRequestResult)
		go githubPR.GetPullRequests(db, userID, "exampleAccountID", pullRequests)
		result = <-pullRequests
		assert.NoError(t, result.Error)
		assert.Equal(t, 1, len(result.PullRequests))
		assert.Equal(t, "Fix big oopsie", result.PullRequests[0].Title)
	})
	t.Run("NoPullRequests", func(t *testing.T) {
		userId := primitive.NewObjectID()

		githubUserNoPullRequestsServer := testutils.GetMockAPIServer(t, 200, `[]`)
		userNoPullRequestsURL := &githubUserNoPullRequestsServer.URL
		defer githubUserNoPullRequestsServer.Close()
		githubPR.Github.Config.ConfigValues.ListPullRequestsURL = userNoPullRequestsURL

		var pullRequests = make(chan PullRequestResult)
		go githubPR.GetPullRequests(db, userId, "exampleAccountID", pullRequests)
		result := <-pullRequests
		assert.NoError(t, result.Error)
		assert.Equal(t, 0, len(result.PullRequests))

		// Check that repository for PR is created in the database
		var repository database.Repository
		repositoryCollection.FindOne(context.Background(), bson.M{"user_id": userId}, nil).Decode(&repository)
		assert.Equal(t, expectedRepository.FullName, repository.FullName)
		assert.Equal(t, expectedRepository.RepositoryID, repository.RepositoryID)

		githubPR.Github.Config.ConfigValues.ListPullRequestsURL = userPullRequestsURL
	})
	t.Run("NoRepositories", func(t *testing.T) {
		userId := primitive.NewObjectID()

		githubUserNoRepositoriesServer := testutils.GetMockAPIServer(t, 200, `[]`)
		userNoRepositoriesURL := &githubUserNoRepositoriesServer.URL
		defer githubUserNoRepositoriesServer.Close()
		githubPR.Github.Config.ConfigValues.ListRepositoriesURL = userNoRepositoriesURL

		var pullRequests = make(chan PullRequestResult)
		go githubPR.GetPullRequests(db, userId, "exampleAccountID", pullRequests)
		result := <-pullRequests
		assert.NoError(t, result.Error)
		assert.Equal(t, 0, len(result.PullRequests))

		// Check that no repository for PR is created in the database
		count, err := repositoryCollection.CountDocuments(context.Background(), bson.M{"user_id": userId}, nil)
		assert.NoError(t, err)
		assert.Equal(t, int64(0), count)

		githubPR.Github.Config.ConfigValues.ListRepositoriesURL = userRepositoriesURL
	})
	t.Run("ExternalError", func(t *testing.T) {
		userId := primitive.NewObjectID()

		githubPR.Github.Config.ConfigValues.GetUserURL = nil

		var pullRequests = make(chan PullRequestResult)
		go githubPR.GetPullRequests(db, userId, "exampleAccountID", pullRequests)
		result := <-pullRequests

		assert.Equal(t, result.Error.Error(), "failed to fetch Github user")
		assert.Error(t, result.Error)

		// Check that no repository for PR is created in the database
		count, err := repositoryCollection.CountDocuments(context.Background(), bson.M{"user_id": userId}, nil)
		assert.NoError(t, err)
		assert.Equal(t, int64(0), count)

		githubPR.Github.Config.ConfigValues.GetUserURL = userURL
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
		assert.Equal(t, fmt.Sprintf("GET %s/user/repos?sort=pushed: 401  []", *userRepositoriesURL), err.Error())
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
	testGithubUserReviewer := &github.User{
		ID: github.Int64(1),
	}
	testGithubUserNotReviewer := &github.User{
		ID: github.Int64(2),
	}
	testGithubUserSubmittedReview := &github.User{
		ID: github.Int64(3),
	}
	reviews := []*github.PullRequestReview{}
	githubPullRequest := &github.PullRequest{
		RequestedReviewers: []*github.User{testGithubUserReviewer},
	}
	t.Run("UserIsReviewer", func(t *testing.T) {
		assert.True(t, userIsReviewer(testGithubUserReviewer, githubPullRequest, reviews, []*github.Team{}))
	})
	t.Run("UserIsReviewerViaTeam", func(t *testing.T) {
		teamID := int64(69420)
		githubPullRequest2 := &github.PullRequest{
			RequestedTeams: []*github.Team{{ID: &teamID}},
		}
		assert.True(t, userIsReviewer(testGithubUserReviewer, githubPullRequest2, reviews, []*github.Team{{ID: &teamID}}))
	})
	// Github API does not consider users who have submitted a review as reviewers, but we still want to show them as a reviewer in our app.
	t.Run("UserSubmittedReview", func(t *testing.T) {
		reviews = append(reviews, &github.PullRequestReview{
			User: testGithubUserSubmittedReview,
		})
		assert.True(t, userIsReviewer(testGithubUserSubmittedReview, githubPullRequest, reviews, []*github.Team{}))
	})
	t.Run("UserIsNotReviewerAndNotSubmittedReview", func(t *testing.T) {
		assert.False(t, userIsReviewer(testGithubUserNotReviewer, githubPullRequest, reviews, []*github.Team{}))
	})
	t.Run("NilPullRequest", func(t *testing.T) {
		assert.False(t, userIsReviewer(testGithubUserReviewer, nil, reviews, []*github.Team{}))
	})
	t.Run("NilUser", func(t *testing.T) {
		assert.False(t, userIsReviewer(nil, githubPullRequest, reviews, []*github.Team{}))
	})
	t.Run("NilFields", func(t *testing.T) {
		testGithubUserReviewer.ID = nil
		assert.False(t, userIsReviewer(testGithubUserReviewer, githubPullRequest, reviews, []*github.Team{}))
	})
}

func TestUserNeedsToSubmitReview(t *testing.T) {
	testGithubUserReviewer := &github.User{
		ID: github.Int64(1),
	}
	testGithubUserNotReviewer := &github.User{
		ID: github.Int64(2),
	}
	teamID := int64(69420)
	reviewers := &github.Reviewers{
		Teams: []*github.Team{{ID: &teamID}},
		Users: []*github.User{testGithubUserReviewer},
	}
	t.Run("UserIsReviewer", func(t *testing.T) {
		assert.True(t, userNeedsToSubmitReview(testGithubUserReviewer, reviewers, []*github.Team{}))
	})
	t.Run("UserIsReviewerViaTeam", func(t *testing.T) {
		assert.True(t, userNeedsToSubmitReview(testGithubUserNotReviewer, reviewers, []*github.Team{{ID: &teamID}}))
	})
	t.Run("UserIsNotReviewerAndNotSubmittedReview", func(t *testing.T) {
		assert.False(t, userNeedsToSubmitReview(testGithubUserNotReviewer, reviewers, []*github.Team{}))
	})
	t.Run("NilUser", func(t *testing.T) {
		assert.False(t, userNeedsToSubmitReview(nil, reviewers, []*github.Team{}))
	})
	t.Run("NilReviewers", func(t *testing.T) {
		assert.False(t, userNeedsToSubmitReview(testGithubUserReviewer, nil, []*github.Team{}))
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

func TestGetComments(t *testing.T) {
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
	expectedCreatedAtTime, _ := time.Parse(time.RFC3339, "2011-01-26T19:01:12Z")
	expectedCreatedAt := primitive.NewDateTimeFromTime(expectedCreatedAtTime)
	t.Run("SingleListComment", func(t *testing.T) {
		githubCommentsServer := testutils.GetMockAPIServer(t, 200, testutils.PullRequestCommentsPayload)
		commentsURL := &githubCommentsServer.URL
		defer githubCommentsServer.Close()

		githubIssueCommentsServer := testutils.GetMockAPIServer(t, 200, `[]`)
		issueCommentsURL := &githubIssueCommentsServer.URL
		defer githubCommentsServer.Close()

		reviews := []*github.PullRequestReview{}
		comments, err := getComments(context, githubClient, repository, pullRequest, reviews, commentsURL, issueCommentsURL)

		assert.NoError(t, err)
		assert.Equal(t, 1, len(comments))
		expectedComment := database.PullRequestComment{
			Type:            constants.COMMENT_TYPE_INLINE,
			Body:            "This is a comment",
			Author:          "chad1616",
			Filepath:        "tothemoon.txt",
			LineNumberStart: 69,
			LineNumberEnd:   420,
			CreatedAt:       expectedCreatedAt,
		}
		assert.Equal(t, expectedComment, comments[0])
	})
	t.Run("SingleIssueComment", func(t *testing.T) {
		githubCommentsServer := testutils.GetMockAPIServer(t, 200, `[]`)
		commentsURL := &githubCommentsServer.URL
		defer githubCommentsServer.Close()

		githubIssueCommentsServer := testutils.GetMockAPIServer(t, 200, testutils.IssueCommentPayload)
		issueCommentsURL := &githubIssueCommentsServer.URL
		defer githubCommentsServer.Close()

		reviews := []*github.PullRequestReview{}
		comments, err := getComments(context, githubClient, repository, pullRequest, reviews, commentsURL, issueCommentsURL)

		assert.NoError(t, err)
		assert.Equal(t, 1, len(comments))
		expectedComment := database.PullRequestComment{
			Type:      constants.COMMENT_TYPE_TOPLEVEL,
			Body:      "This is a issue comment",
			Author:    "gigachad2022",
			CreatedAt: expectedCreatedAt,
		}
		assert.Equal(t, expectedComment, comments[0])
	})
	t.Run("SingleReviewComment", func(t *testing.T) {
		githubCommentsServer := testutils.GetMockAPIServer(t, 200, `[]`)
		commentsURL := &githubCommentsServer.URL
		defer githubCommentsServer.Close()

		githubIssueCommentsServer := testutils.GetMockAPIServer(t, 200, `[]`)
		issueCommentsURL := &githubIssueCommentsServer.URL
		defer githubCommentsServer.Close()

		reviewTime := time.Now()
		author := "elonmusk69420"
		reviews := []*github.PullRequestReview{
			{
				Body:        github.String("This is a review comment"),
				SubmittedAt: &reviewTime,
				User:        &github.User{Login: &author},
			},
			{SubmittedAt: &reviewTime}, // empty body comment should be skipped
		}
		comments, err := getComments(context, githubClient, repository, pullRequest, reviews, commentsURL, issueCommentsURL)

		assert.NoError(t, err)
		assert.Equal(t, 1, len(comments))
		expectedComment := database.PullRequestComment{
			Type:      constants.COMMENT_TYPE_TOPLEVEL,
			Body:      "This is a review comment",
			Author:    "elonmusk69420",
			CreatedAt: primitive.NewDateTimeFromTime(reviewTime),
		}
		assert.Equal(t, expectedComment, comments[0])
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
		comments, err := getComments(context, githubClient, repository, pullRequest, reviews, commentsURL, issueCommentsURL)

		assert.NoError(t, err)
		assert.Equal(t, 3, len(comments))
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
		comments, err := getComments(context, githubClient, repository, pullRequest, reviews, commentsURL, issueCommentsURL)

		assert.Error(t, err)
		assert.Equal(t, fmt.Sprintf("GET %s/repos/chad1616/ExampleRepository/pulls/1/comments: 503  []", *commentsURL), err.Error())
		assert.Zero(t, len(comments))
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
		comments, err := getComments(context, githubClient, repository, pullRequest, reviews, commentsURL, issueCommentsURL)

		assert.Error(t, err)
		assert.Equal(t, "invalid character 'o' looking for beginning of value", err.Error())
		assert.Zero(t, len(comments))
	})
	t.Run("RepositoryIsNil", func(t *testing.T) {
		reviews := []*github.PullRequestReview{}
		comments, err := getComments(context, githubClient, nil, pullRequest, reviews, nil, nil)

		assert.Error(t, err)
		assert.Equal(t, "repository is nil", err.Error())
		assert.Equal(t, 0, len(comments))
	})
	t.Run("PullRequestIsNil", func(t *testing.T) {
		reviews := []*github.PullRequestReview{}
		comments, err := getComments(context, githubClient, repository, nil, reviews, nil, nil)

		assert.Error(t, err)
		assert.Equal(t, "pull request is nil", err.Error())
		assert.Equal(t, 0, len(comments))
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
	t.Run("SingleTeamReview", func(t *testing.T) {
		githubReviewersServer := testutils.GetMockAPIServer(t, 200, testutils.PullRequestTeamReviewersPayload)
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
	user1 := &github.User{Login: github.String("user1")}
	user2 := &github.User{Login: github.String("user2")}

	stringRequestedChanges := github.String("CHANGES_REQUESTED")
	stringApproved := github.String("APPROVED")
	stringCommented := github.String("COMMENTED")

	t.Run("NoReviews", func(t *testing.T) {
		pullRequestReviews := []*github.PullRequestReview{}
		reviewersHaveRequestedChanges := reviewersHaveRequestedChanges(pullRequestReviews)
		assert.False(t, reviewersHaveRequestedChanges)
	})
	t.Run("SingleApprovalReview", func(t *testing.T) {
		pullRequestReviews := []*github.PullRequestReview{
			{User: user1, State: stringApproved},
		}
		reviewersHaveRequestedChanges := reviewersHaveRequestedChanges(pullRequestReviews)
		assert.False(t, reviewersHaveRequestedChanges)
	})
	t.Run("RequestedChangesThenApproved", func(t *testing.T) {
		pullRequestReviews := []*github.PullRequestReview{
			{User: user1, State: stringRequestedChanges},
			{User: user1, State: stringApproved},
		}
		reviewersHaveRequestedChanges := reviewersHaveRequestedChanges(pullRequestReviews)
		assert.False(t, reviewersHaveRequestedChanges)
	})
	t.Run("ApprovedThenRequestedChanges", func(t *testing.T) {
		pullRequestReviews := []*github.PullRequestReview{
			{User: user1, State: stringApproved},
			{User: user1, State: stringRequestedChanges},
		}
		reviewersHaveRequestedChanges := reviewersHaveRequestedChanges(pullRequestReviews)
		assert.True(t, reviewersHaveRequestedChanges)
	})
	t.Run("MultupleUsersReview", func(t *testing.T) {
		pullRequestReviews := []*github.PullRequestReview{
			{User: user1, State: stringRequestedChanges},
			{User: user2, State: stringApproved},
		}
		reviewersHaveRequestedChanges := reviewersHaveRequestedChanges(pullRequestReviews)
		assert.True(t, reviewersHaveRequestedChanges)
	})
	t.Run("IgnoreCommentedState", func(t *testing.T) {
		pullRequestReviews := []*github.PullRequestReview{
			{User: user1, State: stringCommented},
			{User: user1, State: stringRequestedChanges},
			{User: user1, State: stringCommented},
		}
		assert.True(t, reviewersHaveRequestedChanges(pullRequestReviews))
	})
}

func TestCheckRunsDidFail(t *testing.T) {
	t.Run("ChecksPass", func(t *testing.T) {
		checkRunsResult := github.ListCheckRunsResults{
			Total: github.Int(2),
			CheckRuns: []*github.CheckRun{
				{
					Status:     github.String("completed"),
					Conclusion: github.String("success"),
				},
				{
					Status: github.String("in_progress"),
				},
			},
		}
		assert.False(t, checkRunsDidFail(&checkRunsResult))
	})
	t.Run("ChecksFail", func(t *testing.T) {
		checkRunsResult := github.ListCheckRunsResults{
			CheckRuns: []*github.CheckRun{
				{
					Status:     github.String("completed"),
					Conclusion: github.String("success"),
				},
				{
					Status:     github.String("completed"),
					Conclusion: github.String("failure"),
				},
			},
			Total: github.Int(2),
		}
		assert.True(t, checkRunsDidFail(&checkRunsResult))
	})
}

func TestCheckRunsDidFinish(t *testing.T) {
	t.Run("RunDidFinish", func(t *testing.T) {
		checkRunsResult := github.ListCheckRunsResults{
			CheckRuns: []*github.CheckRun{
				{
					Status:     github.String("completed"),
					Conclusion: github.String("success"),
				},
				{
					Status:     github.String("completed"),
					Conclusion: github.String("failure"),
				},
			},
			Total: github.Int(2),
		}
		assert.True(t, checkRunsDidFinish(&checkRunsResult))
	})
	t.Run("RunDidNotFinish", func(t *testing.T) {
		checkRunsResult := github.ListCheckRunsResults{
			CheckRuns: []*github.CheckRun{
				{
					Status:     github.String("completed"),
					Conclusion: github.String("success"),
				},
				{
					Status: github.String("in_progress"),
				},
			},
			Total: github.Int(2),
		}
		assert.False(t, checkRunsDidFinish(&checkRunsResult))
	})
}

func TestGetPullRequestRequiredAction(t *testing.T) {
	reviewers := github.Reviewers{
		Users: []*github.User{},
	}
	authorUserLogin := "testUser"
	t.Run("AddReviewers", func(t *testing.T) {
		pullRequestData := GithubPRData{
			RequestedReviewers: 0,
			IsMergeable:        true,
			IsOwnedByUser:      true,
		}
		action := getPullRequestRequiredAction(pullRequestData)
		assert.Equal(t, "Add Reviewers", action)
	})
	t.Run("FixFailedCI", func(t *testing.T) {
		pullRequestData := GithubPRData{
			RequestedReviewers: 1,
			IsMergeable:        true,
			ChecksDidFail:      true,
			IsOwnedByUser:      true,
		}
		action := getPullRequestRequiredAction(pullRequestData)
		assert.Equal(t, "Fix Failed CI", action)
	})
	t.Run("AddressComments", func(t *testing.T) {
		pullRequestData := GithubPRData{
			RequestedReviewers:   1,
			IsMergeable:          true,
			IsOwnedByUser:        true,
			HaveRequestedChanges: true,
		}
		action := getPullRequestRequiredAction(pullRequestData)
		assert.Equal(t, "Address Comments", action)
	})
	t.Run("FixMergeConflicts", func(t *testing.T) {
		pullRequestData := GithubPRData{
			RequestedReviewers: 1,
			IsMergeable:        false,
			IsOwnedByUser:      true,
		}
		action := getPullRequestRequiredAction(pullRequestData)
		assert.Equal(t, "Fix Merge Conflicts", action)
	})
	t.Run("WaitingOnCI", func(t *testing.T) {
		pullRequestData := GithubPRData{
			RequestedReviewers: 1,
			IsMergeable:        true,
			IsOwnedByUser:      true,
			ChecksDidFail:      false,
			ChecksDidFinish:    false,
		}
		action := getPullRequestRequiredAction(pullRequestData)
		assert.Equal(t, "Waiting on CI", action)
	})
	t.Run("MergePR", func(t *testing.T) {
		pullRequestData := GithubPRData{
			RequestedReviewers:   1,
			IsMergeable:          true,
			ChecksDidFail:        false,
			ChecksDidFinish:      true,
			HaveRequestedChanges: false,
			IsApproved:           true,
			IsOwnedByUser:        true,
		}
		action := getPullRequestRequiredAction(pullRequestData)
		assert.Equal(t, "Merge PR", action)
	})
	t.Run("WaitingOnReview", func(t *testing.T) {
		pullRequestData := GithubPRData{
			RequestedReviewers:   1,
			IsMergeable:          true,
			ChecksDidFail:        false,
			ChecksDidFinish:      true,
			HaveRequestedChanges: false,
			IsApproved:           false,
			IsOwnedByUser:        true,
		}
		action := getPullRequestRequiredAction(pullRequestData)
		assert.Equal(t, "Waiting on Review", action)
	})

	t.Run("NotAuthorAndNotMergeable", func(t *testing.T) {
		// make all lower priority conditions true to verify proper priority
		pullRequestData := GithubPRData{
			RequestedReviewers:   1,
			IsMergeable:          false,
			ChecksDidFail:        false,
			HaveRequestedChanges: true,
			IsApproved:           true,
			IsOwnedByUser:        false,
			UserLogin:            authorUserLogin,
			Reviewers:            &reviewers,
		}
		action := getPullRequestRequiredAction(pullRequestData)
		assert.Equal(t, "Waiting on Author", action)
	})
	t.Run("NotAuthorAndChecksFailed", func(t *testing.T) {
		// make all lower priority conditions true to verify proper priority
		pullRequestData := GithubPRData{
			RequestedReviewers:   1,
			IsMergeable:          true,
			ChecksDidFail:        true,
			HaveRequestedChanges: true,
			IsApproved:           true,
			IsOwnedByUser:        false,
			UserLogin:            authorUserLogin,
			Reviewers:            &reviewers,
		}
		action := getPullRequestRequiredAction(pullRequestData)
		assert.Equal(t, "Waiting on Author", action)
	})
	t.Run("NotAuthorAndNoReviewers", func(t *testing.T) {
		pullRequestData := GithubPRData{
			RequestedReviewers:   0,
			IsMergeable:          true,
			ChecksDidFail:        false,
			HaveRequestedChanges: true,
			IsApproved:           true,
			IsOwnedByUser:        false,
			UserLogin:            authorUserLogin,
			Reviewers:            &reviewers,
		}
		action := getPullRequestRequiredAction(pullRequestData)
		assert.Equal(t, "Waiting on Author", action)
	})
	t.Run("NotAuthorAndRequestedChanges", func(t *testing.T) {
		pullRequestData := GithubPRData{
			RequestedReviewers:   1,
			IsMergeable:          true,
			ChecksDidFail:        false,
			HaveRequestedChanges: true,
			IsApproved:           true,
			IsOwnedByUser:        false,
			UserLogin:            authorUserLogin,
			Reviewers:            &reviewers,
		}
		action := getPullRequestRequiredAction(pullRequestData)
		assert.Equal(t, "Waiting on Author", action)
	})
	t.Run("NotAuthorAndApproved", func(t *testing.T) {
		pullRequestData := GithubPRData{
			RequestedReviewers:   1,
			IsMergeable:          true,
			ChecksDidFail:        false,
			HaveRequestedChanges: true,
			IsApproved:           true,
			IsOwnedByUser:        false,
			UserLogin:            authorUserLogin,
			Reviewers:            &reviewers,
		}
		action := getPullRequestRequiredAction(pullRequestData)

		assert.Equal(t, "Waiting on Author", action)
	})
	t.Run("NotAuthorAndNoAuthorActionRequired", func(t *testing.T) {
		pullRequestData := GithubPRData{
			RequestedReviewers:   1,
			IsMergeable:          true,
			ChecksDidFail:        false,
			HaveRequestedChanges: false,
			IsApproved:           false,
			IsOwnedByUser:        false,
			UserLogin:            authorUserLogin,
			Reviewers:            &reviewers,
		}
		action := getPullRequestRequiredAction(pullRequestData)
		assert.Equal(t, "Waiting on Author", action)
	})
	t.Run("NotAuthorandReviewPR", func(t *testing.T) {
		reviewers.Users = append(reviewers.Users, &github.User{Login: &authorUserLogin})
		pullRequestData := GithubPRData{
			RequestedReviewers:   1,
			IsMergeable:          true,
			ChecksDidFail:        false,
			HaveRequestedChanges: false,
			IsApproved:           false,
			IsOwnedByUser:        false,
			UserLogin:            authorUserLogin,
			Reviewers:            &reviewers,
			UserIsReviewer:       true,
		}
		action := getPullRequestRequiredAction(pullRequestData)
		assert.Equal(t, "Review PR", action)
	})
}

func TestUpdateOrCreateRepository(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	repositoryCollection := database.GetRepositoryCollection(db)

	userID := primitive.NewObjectID()
	var repositoryID int64 = 123
	repositoryFullName := "wow/repository"
	htmlURL := "http://niceme.me"
	repository := &github.Repository{
		ID:       github.Int64(repositoryID),
		FullName: github.String(repositoryFullName),
		HTMLURL:  github.String(htmlURL),
	}
	updateFullName := github.String("new_repository_name")
	updateHTMLURL := github.String("http://new.me")
	t.Run("SuccessCreate", func(t *testing.T) {
		err = updateOrCreateRepository(db, repository, userID)
		assert.NoError(t, err)

		var result []database.Repository
		cursor, err := repositoryCollection.Find(
			context.Background(),
			bson.M{"$and": []bson.M{
				{"repository_id": fmt.Sprint(repository.GetID())},
				{"user_id": userID},
			}},
		)
		assert.NoError(t, err)

		err = cursor.All(context.Background(), &result)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(result))
		assert.Equal(t, fmt.Sprint(repository.GetID()), result[0].RepositoryID)
		assert.Equal(t, repository.GetFullName(), result[0].FullName)
		assert.Equal(t, repository.GetHTMLURL(), result[0].Deeplink)
	})
	t.Run("SuccessUpdate", func(t *testing.T) {
		repository.FullName = updateFullName
		repository.HTMLURL = updateHTMLURL

		err = updateOrCreateRepository(db, repository, userID)
		assert.NoError(t, err)

		var result []database.Repository
		cursor, err := repositoryCollection.Find(
			context.Background(),
			bson.M{"$and": []bson.M{
				{"repository_id": fmt.Sprint(repository.GetID())},
				{"user_id": userID},
			}},
		)
		assert.NoError(t, err)
		err = cursor.All(context.Background(), &result)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(result))
		assert.Equal(t, fmt.Sprint(repository.GetID()), result[0].RepositoryID)
		assert.Equal(t, *updateFullName, result[0].FullName)
		assert.Equal(t, *updateHTMLURL, result[0].Deeplink)
	})
	t.Run("IncorrectUserID", func(t *testing.T) {
		newFullName := github.String("bad_user_id_full_name")
		repository.FullName = newFullName

		err = updateOrCreateRepository(db, repository, primitive.NewObjectID())
		assert.NoError(t, err)

		var result []database.Repository
		cursor, err := repositoryCollection.Find(
			context.Background(),
			bson.M{"$and": []bson.M{
				{"repository_id": fmt.Sprint(repository.GetID())},
				{"user_id": userID},
			}},
		)
		assert.NoError(t, err)
		err = cursor.All(context.Background(), &result)
		assert.NoError(t, err)
		assert.Equal(t, fmt.Sprint(repository.GetID()), result[0].RepositoryID)
		assert.Equal(t, *updateFullName, result[0].FullName)
		assert.Equal(t, *updateHTMLURL, result[0].Deeplink)
	})
	t.Run("IncorrectRepositoryID", func(t *testing.T) {
		newFullName := github.String("bad_repository_id_full_name")
		repository.FullName = newFullName
		repository.ID = github.Int64(0)

		err = updateOrCreateRepository(db, repository, userID)
		assert.NoError(t, err)

		var result []database.Repository
		cursor, err := repositoryCollection.Find(
			context.Background(),
			bson.M{"$and": []bson.M{
				{"repository_id": fmt.Sprint(repositoryID)},
				{"user_id": userID},
			}},
		)
		assert.NoError(t, err)
		err = cursor.All(context.Background(), &result)
		assert.NoError(t, err)
		assert.Equal(t, fmt.Sprint(repositoryID), result[0].RepositoryID)
		assert.Equal(t, *updateFullName, result[0].FullName)
		assert.Equal(t, *updateHTMLURL, result[0].Deeplink)
	})
}
