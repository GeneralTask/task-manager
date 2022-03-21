package external

import (
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/google/go-github/v39/github"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/oauth2"
)

type GithubPRSource struct {
	Github GithubService
}

func (gitPR GithubPRSource) GetEmails(userID primitive.ObjectID, accountID string, result chan<- EmailResult) {
	result <- emptyEmailResult(nil)
}

func (gitPR GithubPRSource) GetEvents(userID primitive.ObjectID, accountID string, startTime time.Time, endTime time.Time, result chan<- CalendarResult) {
	result <- emptyCalendarResult(nil)
}

func (gitPR GithubPRSource) GetTasks(userID primitive.ObjectID, accountID string, result chan<- TaskResult) {
	result <- emptyTaskResult(nil)
}

func (gitPR GithubPRSource) GetPullRequests(userID primitive.ObjectID, accountID string, result chan<- PullRequestResult) {
	parentCtx := context.Background()

	var githubClient *github.Client
	var err error

	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		result <- emptyPullRequestResult(err)
		return
	}
	defer dbCleanup()

	externalAPITokenCollection := database.GetExternalTokenCollection(db)
	token, err := GetGithubToken(externalAPITokenCollection, userID, accountID)
	if token == nil {
		log.Printf("failed to fetch Github API token")
		result <- emptyPullRequestResult(errors.New("failed to fetch Github API token"))
		return
	}
	if err != nil {
		result <- emptyPullRequestResult(err)
		return
	}
	tokenSource := oauth2.StaticTokenSource(
		&oauth2.Token{AccessToken: token.AccessToken},
	)
	extCtx, cancel := context.WithTimeout(parentCtx, constants.ExternalTimeout)
	defer cancel()
	tokenClient := oauth2.NewClient(extCtx, tokenSource)
	githubClient = github.NewClient(tokenClient)

	extCtx, cancel = context.WithTimeout(parentCtx, constants.ExternalTimeout)
	defer cancel()
	// passing empty string here means fetching the currently authed user
	githubUser, _, err := githubClient.Users.Get(extCtx, "")
	if err != nil {
		log.Println("failed to fetch Github user")
		result <- emptyPullRequestResult(errors.New("failed to fetch Github user"))
		return
	}

	var pullRequestItems []*database.Item
	listOptions := github.PullRequestListOptions{}
	extCtx, cancel = context.WithTimeout(parentCtx, constants.ExternalTimeout)
	defer cancel()
	// TODO(john): Make this work for other repos
	pullRequests, _, err := githubClient.PullRequests.List(extCtx, "GeneralTask", "task-manager", &listOptions)
	if err != nil {
		log.Println("failed to fetch Github PRs")
		result <- emptyPullRequestResult(errors.New("failed to fetch Github PRs"))
		return
	}
	for _, pullRequest := range pullRequests {
		body := ""
		if pullRequest.Body != nil {
			body = *pullRequest.Body
		}
		if !userIsOwner(githubUser, pullRequest) && !userIsReviewer(githubUser, pullRequest) {
			continue
		}
		pullRequest := &database.Item{
			TaskBase: database.TaskBase{
				UserID:          userID,
				IDExternal:      fmt.Sprint(*pullRequest.ID),
				IDTaskSection:   constants.IDTaskSectionToday,
				Deeplink:        *pullRequest.HTMLURL,
				SourceID:        TASK_SOURCE_ID_GITHUB_PR,
				Title:           *pullRequest.Title,
				Body:            body,
				TimeAllocation:  time.Hour.Nanoseconds(),
				SourceAccountID: accountID,
			},
			PullRequest: database.PullRequest{
				Opened: primitive.NewDateTimeFromTime(*pullRequest.CreatedAt),
			},
			TaskType: database.TaskType{
				IsTask:        true,
				IsPullRequest: true,
			},
		}
		pullRequestItems = append(pullRequestItems, pullRequest)
	}

	for _, pullRequest := range pullRequestItems {
		var dbPR database.Item
		isCompleted := false
		res, err := database.UpdateOrCreateTask(
			db,
			userID,
			string(pullRequest.IDExternal),
			pullRequest.SourceID,
			pullRequest,
			database.PullRequestChangeableFields{
				Title:       pullRequest.Title,
				Body:        pullRequest.Body,
				IsCompleted: &isCompleted,
			},
		)
		if err != nil {
			log.Printf("failed to update or create pull request: %v", err)
			result <- emptyPullRequestResult(err)
			return
		}
		err = res.Decode(&dbPR)
		if err != nil {
			log.Printf("failed to update or create pull request: %v", err)
			result <- emptyPullRequestResult(err)
			return
		}
		pullRequest.ID = dbPR.ID
		pullRequest.IDOrdering = dbPR.IDOrdering
		pullRequest.IDTaskSection = dbPR.IDTaskSection
	}

	result <- PullRequestResult{
		PullRequests: pullRequestItems,
		Error:        nil,
	}
}

func userIsOwner(githubUser *github.User, pullRequest *github.PullRequest) bool {
	return (githubUser.ID != nil &&
		pullRequest.User.ID != nil &&
		*githubUser.ID == *pullRequest.User.ID)
}

func userIsReviewer(githubUser *github.User, pullRequest *github.PullRequest) bool {
	for _, reviewer := range pullRequest.RequestedReviewers {
		if githubUser.ID != nil && reviewer.ID != nil && *githubUser.ID == *reviewer.ID {
			return true
		}
	}
	return false
}

func (gitPR GithubPRSource) Reply(userID primitive.ObjectID, accountID string, taskID primitive.ObjectID, emailContents EmailContents) error {
	return errors.New("cannot reply to a PR")
}

func (gitPR GithubPRSource) SendEmail(userID primitive.ObjectID, accountID string, email EmailContents) error {
	return errors.New("cannot send email for github pr")
}

func (gitPR GithubPRSource) CreateNewTask(userID primitive.ObjectID, accountID string, pullRequest TaskCreationObject) error {
	return errors.New("has not been implemented yet")
}

func (gitPR GithubPRSource) ModifyTask(userID primitive.ObjectID, accountID string, issueID string, updateFields *database.TaskChangeableFields) error {
	if updateFields.IsCompleted != nil && *updateFields.IsCompleted {
		return errors.New("cannot mark PR as done")
	}
	return nil
}

func (gitPR GithubPRSource) ModifyMessage(userID primitive.ObjectID, accountID string, emailID string, updateFields *database.MessageChangeable) error {
	return nil
}
