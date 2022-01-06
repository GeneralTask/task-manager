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

	var pullRequests []*database.PullRequest
	listOptions := github.IssueListOptions{}
	extCtx, cancel = context.WithTimeout(parentCtx, constants.ExternalTimeout)
	defer cancel()
	issues, _, err := githubClient.Issues.List(extCtx, true, &listOptions)
	if err != nil {
		log.Printf("failed to fetch Github PRs")
		result <- emptyPullRequestResult(errors.New("failed to fetch Github PRs"))
		return
	}
	for _, issue := range issues {
		if issue.IsPullRequest() {
			pullRequest := &database.PullRequest{
				TaskBase: database.TaskBase{
					UserID:          userID,
					IDExternal:      fmt.Sprint(*issue.ID),
					IDTaskSection:   constants.IDTaskSectionToday,
					Deeplink:        *issue.HTMLURL,
					SourceID:        TASK_SOURCE_ID_GITHUB_PR,
					Title:           *issue.Title,
					Body:            *issue.Body,
					TimeAllocation:  time.Hour.Nanoseconds(),
					SourceAccountID: accountID,
				},
				Opened: primitive.NewDateTimeFromTime(*issue.CreatedAt),
			}
			pullRequests = append(pullRequests, pullRequest)
		}
	}

	for _, pullRequest := range pullRequests {
		var dbPR database.PullRequest
		res, err := database.UpdateOrCreatePullRequest(
			db,
			userID,
			string(pullRequest.IDExternal),
			pullRequest.SourceID,
			pullRequest,
			database.PullRequestChangeableFields{
				Title: pullRequest.Title,
				Body:  pullRequest.Body,
			},
		)
		if err != nil {
			log.Printf("failed to update or create pull request: %v", err)
			result <- emptyPullRequestResult(err)
			return
		}
		err = res.Decode(&err)
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
		PullRequests: pullRequests,
		Error:        nil,
	}
}

func (gitPR GithubPRSource) MarkAsDone(userID primitive.ObjectID, accountID string, taskID string) error {
	return errors.New("cannot mark PR as done")
}

func (gitPR GithubPRSource) Reply(userID primitive.ObjectID, accountID string, taskID primitive.ObjectID, body string) error {
	return errors.New("cannot reply to a PR")
}

func (gitPR GithubPRSource) CreateNewTask(userID primitive.ObjectID, accountID string, pullRequest TaskCreationObject) error {
	return errors.New("has not been implemented yet")
}

func (gitPR GithubPRSource) ModifyTask(userID primitive.ObjectID, accountID string, taskID primitive.ObjectID, updateFields *database.TaskChangeableFields) error {
	return nil
}
