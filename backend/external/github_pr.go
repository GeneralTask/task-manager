package external

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/rs/zerolog/log"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/google/go-github/v39/github"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/oauth2"
)

const (
	CurrentlyAuthedUserFilter string = ""
	RepoOwnerTypeOrganization string = "Organization"
)

type GithubPRSource struct {
	Github GithubService
}

func (gitPR GithubPRSource) GetEmails(userID primitive.ObjectID, accountID string, latestHistoryID uint64, result chan<- EmailResult, fullRefresh bool) {
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
		log.Error().Msg("failed to fetch Github API token")
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
	githubUser, _, err := githubClient.Users.Get(extCtx, CurrentlyAuthedUserFilter)
	if err != nil || githubUser == nil {
		log.Error().Msg("failed to fetch Github user")
		result <- emptyPullRequestResult(errors.New("failed to fetch Github user"))
		return
	}

	repos, _, err := githubClient.Repositories.List(extCtx, CurrentlyAuthedUserFilter, nil)
	if err != nil {
		log.Error().Msg("failed to fetch Github repos for user")
		result <- emptyPullRequestResult(errors.New("failed to fetch Github repos for user"))
		return
	}
	repoNameToOwner := getReposInOrganizations(repos)

	pullRequests := []*github.PullRequest{}
	var pullRequestItems []*database.Item
	for repoName, ownerName := range repoNameToOwner {
		extCtx, cancel = context.WithTimeout(parentCtx, constants.ExternalTimeout)
		defer cancel()
		fetchedPullRequests, _, err := githubClient.PullRequests.List(extCtx, ownerName, repoName, nil)
		if err != nil && !strings.Contains(err.Error(), "404 Not Found") {
			result <- emptyPullRequestResult(errors.New("failed to fetch Github PRs"))
			return
		}
		pullRequests = append(pullRequests, fetchedPullRequests...)
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
				IDTaskSection:   constants.IDTaskSectionDefault,
				Deeplink:        *pullRequest.HTMLURL,
				SourceID:        TASK_SOURCE_ID_GITHUB_PR,
				Title:           *pullRequest.Title,
				Body:            body,
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
		isCompleted := false
		dbPR, err := database.UpdateOrCreateTask(
			db,
			userID,
			string(pullRequest.IDExternal),
			pullRequest.SourceID,
			pullRequest,
			database.PullRequestChangeableFields{
				Title:       pullRequest.Title,
				Body:        pullRequest.TaskBase.Body,
				IsCompleted: &isCompleted,
			},
			nil,
			false)
		if err != nil {
			log.Error().Err(err).Msg("failed to update or create pull request")
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

func getReposInOrganizations(repos []*github.Repository) map[string]string {
	repoNameToOwner := make(map[string]string)
	for _, repo := range repos {
		if repo != nil &&
			repo.Name != nil &&
			repo.Owner != nil &&
			repo.Owner.Login != nil &&
			repo.Owner.Type != nil &&
			*repo.Owner.Type == RepoOwnerTypeOrganization {
			repoNameToOwner[*repo.Name] = *repo.Owner.Login
		}
	}
	return repoNameToOwner
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

func (gitPR GithubPRSource) Reply(userID primitive.ObjectID, accountID string, messageID primitive.ObjectID, emailContents EmailContents) error {
	return errors.New("cannot reply to a PR")
}

func (gitPR GithubPRSource) SendEmail(userID primitive.ObjectID, accountID string, email EmailContents) error {
	return errors.New("cannot send email for github pr")
}

func (gitPR GithubPRSource) CreateNewTask(userID primitive.ObjectID, accountID string, task TaskCreationObject) (primitive.ObjectID, error) {
	return primitive.NilObjectID, errors.New("has not been implemented yet")
}

func (gitPR GithubPRSource) CreateNewEvent(userID primitive.ObjectID, accountID string, event EventCreateObject) error {
	return errors.New("has not been implemented yet")
}

func (gitPR GithubPRSource) ModifyTask(userID primitive.ObjectID, accountID string, issueID string, updateFields *database.TaskChangeableFields) error {
	// allow users to mark PR as done in GT even if it's not done in Github
	return nil
}

func (gitPR GithubPRSource) ModifyMessage(userID primitive.ObjectID, accountID string, emailID string, updateFields *database.MessageChangeable) error {
	return nil
}

func (gitPR GithubPRSource) ModifyThread(userID primitive.ObjectID, accountID string, threadID primitive.ObjectID, isUnread *bool, IsArchived *bool) error {
	return nil
}
