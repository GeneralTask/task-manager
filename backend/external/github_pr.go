package external

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"strings"
	"time"

	"github.com/rs/zerolog/log"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/google/go-github/v45/github"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/oauth2"
)

const (
	CurrentlyAuthedUserFilter string = ""
	RepoOwnerTypeOrganization string = "Organization"
	ApprovedState             string = "APPROVED"
	ChangesRequestedState     string = "CHANGES_REQUESTED"
)

const (
	AddReviewersAction      string = "Add Reviewers"
	FixMergeConflictsAction string = "Fix Merge Conflicts"
	FixFailedCIAction       string = "Fix Failed CI"
	AddressRequestedAction  string = "Address Requested Changes"
	MergePRAction           string = "Merge PR"
	WaitingOnReviewAction   string = "Waiting on Review"
)

type GithubPRSource struct {
	Github GithubService
}

type GithubActionData struct {
	RequestedReviewers   int
	IsMergeable          bool
	IsApproved           bool
	HaveRequestedChanges bool
	ChecksDidFail        bool
}

func (gitPR GithubPRSource) GetEmails(userID primitive.ObjectID, accountID string, result chan<- EmailResult, fullRefresh bool) {
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
	extCtx, cancel := context.WithTimeout(parentCtx, constants.ExternalTimeout)
	defer cancel()
	db, dbCleanup, err := database.GetDBConnection()
	defer dbCleanup()

	if gitPR.Github.Config.ConfigValues.GithubClientURL != nil {
		githubClient = github.NewClient(nil)
		githubClient.BaseURL, err = url.Parse(*gitPR.Github.Config.ConfigValues.GithubClientURL)
		if err != nil {
			log.Error().Err(err).Msg("Failed to parse github client url")
			result <- emptyPullRequestResult(err)
			return
		}
	} else {
		if err != nil {
			result <- emptyPullRequestResult(err)
			return
		}
	
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

		tokenClient := oauth2.NewClient(extCtx, tokenSource)
		githubClient = github.NewClient(tokenClient)
		extCtx, cancel = context.WithTimeout(parentCtx, constants.ExternalTimeout)
		defer cancel()
	}
	githubUser, err := getGithubUser(extCtx, githubClient, CurrentlyAuthedUserFilter, gitPR.Github.Config.ConfigValues.UsersGetURL)
	
	if err != nil || githubUser == nil {
		log.Error().Msg("failed to fetch Github user")
		result <- emptyPullRequestResult(errors.New("failed to fetch Github user"))
		return
	}

	repositories, _, err := githubClient.Repositories.List(extCtx, CurrentlyAuthedUserFilter, nil)
	if err != nil {
		log.Error().Msg("failed to fetch Github repos for user")
		result <- emptyPullRequestResult(errors.New("failed to fetch Github repos for user"))
		return
	}

	var pullRequestItems []*database.Item
	for _, repository := range repositories {
		extCtx, cancel = context.WithTimeout(parentCtx, constants.ExternalTimeout)
		defer cancel()
		fetchedPullRequests, _, err := githubClient.PullRequests.List(extCtx, *repository.Owner.Login, *repository.Name, nil)
		if err != nil && !strings.Contains(err.Error(), "404 Not Found") {
			result <- emptyPullRequestResult(errors.New("failed to fetch Github PRs"))
			return
		}
		for _, pullRequest := range fetchedPullRequests {
			if !userIsOwner(githubUser, pullRequest) && !userIsReviewer(githubUser, pullRequest) {
				continue
			}

			reviews, _, err := githubClient.PullRequests.ListReviews(extCtx, *repository.Owner.Login, *repository.Name, *pullRequest.Number, nil)
			if err != nil {
				result <- emptyPullRequestResult(errors.New("failed to fetch Github PR reviews"))
				return
			}
			requestedReviewers, err := getReviewerCount(extCtx, githubClient, repository, pullRequest, reviews)
			if err != nil {
				result <- emptyPullRequestResult(errors.New("failed to fetch Github PR reviewers"))
				return
			}
			pullRequestFetch, _, err := githubClient.PullRequests.Get(extCtx, *repository.Owner.Login, *repository.Name, *pullRequest.Number)
			if err != nil {
				result <- emptyPullRequestResult(errors.New("failed to fetch Github PR"))
				return
			}

			checksDidFail, err := checksDidFail(extCtx, githubClient, repository, pullRequest)
			if err != nil {
				result <- emptyPullRequestResult(errors.New("failed to fetch Github PR check runs"))
				return
			}
			commentCount, err := getCommentCount(extCtx, githubClient, repository, pullRequest, reviews)
			if err != nil {
				result <- emptyPullRequestResult(errors.New("failed to fetch Github PR comments"))
				return
			}

			actionData := GithubActionData{
				RequestedReviewers:   requestedReviewers,
				IsMergeable:          pullRequestFetch.GetMergeable(),
				IsApproved:           pullRequestIsApproved(reviews),
				HaveRequestedChanges: reviewersHaveRequestedChanges(reviews),
				ChecksDidFail:        checksDidFail,
			}

			pullRequest := &database.Item{
				TaskBase: database.TaskBase{
					UserID:            userID,
					IDExternal:        fmt.Sprint(*pullRequest.ID),
					Deeplink:          *pullRequest.HTMLURL,
					SourceID:          TASK_SOURCE_ID_GITHUB_PR,
					Title:             *pullRequest.Title,
					SourceAccountID:   accountID,
					CreatedAtExternal: primitive.NewDateTimeFromTime(*pullRequest.CreatedAt),
				},
				PullRequest: database.PullRequest{
					RepositoryId:   fmt.Sprint(*repository.ID),
					RepositoryName: *repository.Name,
					Number:         *pullRequest.Number,
					Author:         *pullRequest.User.Login,
					Branch:         *pullRequest.Head.Ref,
					RequiredAction: getPullRequestRequiredAciton(actionData),
					CommentCount:   commentCount,
				},
				TaskType: database.TaskType{
					IsTask:        true,
					IsPullRequest: true,
				},
			}
			pullRequestItems = append(pullRequestItems, pullRequest)
		}
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

func getGithubUser(ctx context.Context, githubClient *github.Client, currentlyAuthedUserFilter string, overrideURL *string) (*github.User, error) {
	if overrideURL != nil {
		baseURl, err := url.Parse(fmt.Sprintf("%s/", *overrideURL))
		githubClient.BaseURL = baseURl
		if err != nil {
			return nil, err
		}
	}
	githubUser, _, err := githubClient.Users.Get(ctx, currentlyAuthedUserFilter)
	return githubUser, err
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

func pullRequestIsApproved(pullRequestReviews []*github.PullRequestReview) bool {
	for _, review := range pullRequestReviews {
		if review.State != nil && *review.State == ApprovedState {
			return true
		}
	}
	return false
}

func getCommentCount(context context.Context, githubClient *github.Client, repository *github.Repository, pullRequest *github.PullRequest, reviews []*github.PullRequestReview) (int, error) {
	comments, _, err := githubClient.PullRequests.ListComments(context, *repository.Owner.Login, *repository.Name, *pullRequest.Number, nil)
	if err != nil {
		return 0, err
	}
	issueComments, _, err := githubClient.Issues.ListComments(context, *repository.Owner.Login, *repository.Name, *pullRequest.Number, nil)
	if err != nil {
		return 0, err
	}
	reviewCommentCount := 0
	for _, review := range reviews {
		if review.GetBody() != "" {
			reviewCommentCount += 1
		}
	}
	return len(comments) + len(issueComments) + reviewCommentCount, nil
}

func getReviewerCount(context context.Context, githubClient *github.Client, repository *github.Repository, pullRequest *github.PullRequest, reviews []*github.PullRequestReview) (int, error) {
	reviewers, _, err := githubClient.PullRequests.ListReviewers(context, *repository.Owner.Login, *repository.Name, *pullRequest.Number, nil)
	if err != nil {
		return 0, err
	}
	submittedReviews := 0
	for _, review := range reviews {
		state := review.GetState()
		if review.GetUser() != nil && (state == ApprovedState || state == ChangesRequestedState) {
			submittedReviews += 1
		}
	}
	return submittedReviews + len(reviewers.Users), nil
}

func reviewersHaveRequestedChanges(reviews []*github.PullRequestReview) bool {
	userToMostRecentReview := make(map[string]string)
	for _, review := range reviews {
		userToMostRecentReview[review.GetUser().GetLogin()] = review.GetState()
	}
	for _, review := range userToMostRecentReview {
		if review == ChangesRequestedState {
			return true
		}
	}
	return false
}

func checksDidFail(context context.Context, githubClient *github.Client, repository *github.Repository, pullRequest *github.PullRequest) (bool, error) {
	checkRuns, _, err := githubClient.Checks.ListCheckRunsForRef(context, *repository.Owner.Login, *repository.Name, *pullRequest.Head.SHA, nil)
	if err != nil {
		return false, err
	}

	// check runs are individual tests that make up a check suite associated with a commit
	for _, run := range checkRuns.CheckRuns {
		if run.GetStatus() == "completed" && (run.GetConclusion() == "failure" || run.GetConclusion() == "timed_out") {
			return true, nil
		}
	}
	return false, nil
}

func getPullRequestRequiredAciton(data GithubActionData) string {
	if data.RequestedReviewers == 0 {
		return AddReviewersAction
	}
	if !data.IsMergeable {
		return FixMergeConflictsAction
	}
	if data.ChecksDidFail {
		return FixFailedCIAction
	}
	if data.HaveRequestedChanges {
		return AddressRequestedAction
	}
	if data.IsApproved {
		return MergePRAction
	}
	return WaitingOnReviewAction
}

func (gitPR GithubPRSource) Reply(userID primitive.ObjectID, accountID string, messageID primitive.ObjectID, emailContents EmailContents) error {
	return errors.New("cannot reply to a PR")
}

func (gitPR GithubPRSource) SendEmail(userID primitive.ObjectID, accountID string, email EmailContents) error {
	return errors.New("cannot send email for github pr")
}

func (gitPR GithubPRSource) CreateNewTask(userID primitive.ObjectID, accountID string, pullRequest TaskCreationObject) error {
	return errors.New("has not been implemented yet")
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
