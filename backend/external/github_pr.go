package external

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"strings"
	"time"

	"github.com/GeneralTask/task-manager/backend/logging"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/google/go-github/v45/github"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	CurrentlyAuthedUserFilter string = ""
	RepoOwnerTypeOrganization string = "Organization"
	StateApproved             string = "APPROVED"
	StateRequestedChanges     string = "REQUESTED_CHANGES"
)

const (
	ActionAddReviewers      string = "Add Reviewers"
	ActionFixMergeConflicts string = "Fix Merge Conflicts"
	ActionFixFailedCI       string = "Fix Failed CI"
	ActionAddressRequested  string = "Address Requested Changes"
	ActionMergePR           string = "Merge PR"
	ActionWaitingOnAuthor   string = "Waiting on Author"
	ActionWaitingOnReview   string = "Waiting on Review"
	ActionReviewPR          string = "Review PR"
)

const (
	ChecksStatusCompleted    string = "completed"
	ChecksConclusionFailure  string = "failure"
	ChecksConclusionTimedOut string = "timed_out"
)

type GithubPRSource struct {
	Github GithubService
}

type GithubPRData struct {
	RequestedReviewers   int
	Reviewers            *github.Reviewers
	IsMergeable          bool
	IsApproved           bool
	HaveRequestedChanges bool
	ChecksDidFail        bool
	IsOwnedByUser        bool
	UserLogin            string
}

type GithubPRRequestData struct {
	Client      *github.Client
	User        *github.User
	Repository  *github.Repository
	PullRequest *github.PullRequest
}

func (gitPR GithubPRSource) GetEvents(userID primitive.ObjectID, accountID string, startTime time.Time, endTime time.Time, result chan<- CalendarResult) {
	result <- emptyCalendarResult(nil)
}

func (gitPR GithubPRSource) GetTasks(userID primitive.ObjectID, accountID string, result chan<- TaskResult) {
	result <- emptyTaskResult(nil)
}

func (gitPR GithubPRSource) GetPullRequests(userID primitive.ObjectID, accountID string, result chan<- PullRequestResult) {
	parentCtx := context.Background()
	logger := logging.GetSentryLogger()

	var githubClient *github.Client
	extCtx, cancel := context.WithTimeout(parentCtx, constants.ExternalTimeout)
	defer cancel()
	db, dbCleanup, err := database.GetDBConnection()
	defer dbCleanup()
	if err != nil {
		result <- emptyPullRequestResult(err)
		return
	}

	if gitPR.Github.Config.ConfigValues.FetchExternalAPIToken != nil && *gitPR.Github.Config.ConfigValues.FetchExternalAPIToken {
		externalAPITokenCollection := database.GetExternalTokenCollection(db)
		token, err := GetGithubToken(externalAPITokenCollection, userID, accountID)
		if token == nil {
			logger.Error().Msg("failed to fetch Github API token")
			result <- emptyPullRequestResult(errors.New("failed to fetch Github API token"))
			return
		}
		if err != nil {
			result <- emptyPullRequestResult(err)
			return
		}

		githubClient = getGithubClientFromToken(extCtx, token)
	} else {
		githubClient = github.NewClient(nil)
	}

	extCtx, cancel = context.WithTimeout(parentCtx, constants.ExternalTimeout)
	defer cancel()

	githubUser, err := getGithubUser(extCtx, githubClient, CurrentlyAuthedUserFilter, gitPR.Github.Config.ConfigValues.GetUserURL)
	if err != nil || githubUser == nil {
		logger.Error().Err(err).Msg("failed to fetch Github user")
		result <- emptyPullRequestResult(errors.New("failed to fetch Github user"))
		return
	}

	repositories, err := getGithubRepositories(extCtx, githubClient, CurrentlyAuthedUserFilter, gitPR.Github.Config.ConfigValues.ListRepositoriesURL)
	if err != nil {
		logger.Error().Err(err).Msg("failed to fetch Github repos for user")
		result <- emptyPullRequestResult(errors.New("failed to fetch Github repos for user"))
		return
	}

	var pullRequestChannels []chan *database.Item
	for _, repository := range repositories {
		extCtx, cancel = context.WithTimeout(parentCtx, constants.ExternalTimeout)
		defer cancel()
		fetchedPullRequests, err := getGithubPullRequests(extCtx, githubClient, repository, gitPR.Github.Config.ConfigValues.ListPullRequestsURL)
		if err != nil && !strings.Contains(err.Error(), "404 Not Found") {
			result <- emptyPullRequestResult(errors.New("failed to fetch Github PRs"))
			return
		}
		for _, pullRequest := range fetchedPullRequests {
			pullRequestChan := make(chan *database.Item)
			requestData := GithubPRRequestData{
				Client:      githubClient,
				User:        githubUser,
				Repository:  repository,
				PullRequest: pullRequest,
			}
			go gitPR.getPullRequestInfo(extCtx, userID, accountID, requestData, pullRequestChan)
			pullRequestChannels = append(pullRequestChannels, pullRequestChan)
		}
	}

	var pullRequestItems []*database.Item
	for _, pullRequestChan := range pullRequestChannels {
		pullRequest := <-pullRequestChan
		// if nil, this means that the request ran into an error: continue and keep processing the rest
		if pullRequest == nil {
			continue
		}

		isCompleted := false
		dbPR, err := database.UpdateOrCreateItem(
			db,
			userID,
			string(pullRequest.IDExternal),
			pullRequest.SourceID,
			pullRequest,
			database.PullRequestItemChangeable{
				Title:       &pullRequest.Title,
				Body:        &pullRequest.TaskBase.Body,
				IsCompleted: &isCompleted,
				PullRequestChangeableFields: database.PullRequestChangeableFields{
					LastUpdatedAt:  &pullRequest.PullRequest.LastUpdatedAt,
					CommentCount:   &pullRequest.CommentCount,
					RequiredAction: &pullRequest.RequiredAction,
				},
			},
			nil,
			true)

		if err != nil {
			logger.Error().Err(err).Msg("failed to update or create pull request")
			result <- emptyPullRequestResult(err)
			return
		}
		pullRequest.ID = dbPR.ID
		pullRequest.IDOrdering = dbPR.IDOrdering
		pullRequest.IDTaskSection = dbPR.IDTaskSection

		pullRequestItems = append(pullRequestItems, pullRequest)
	}

	result <- PullRequestResult{
		PullRequests: pullRequestItems,
		Error:        nil,
	}
}

func (gitPR GithubPRSource) getPullRequestInfo(extCtx context.Context, userID primitive.ObjectID, accountID string, requestData GithubPRRequestData, result chan<- *database.Item) {
	logger := logging.GetSentryLogger()

	githubClient := requestData.Client
	githubUser := requestData.User
	repository := requestData.Repository
	pullRequest := requestData.PullRequest

	reviews, _, err := githubClient.PullRequests.ListReviews(extCtx, *repository.Owner.Login, *repository.Name, *pullRequest.Number, nil)
	if err != nil {
		logger.Error().Err(err).Msg("failed to fetch Github PR reviews")
		result <- nil
		return
	}
	// Only display pull requests where user is the owner, or the user is a reviewer
	if !userIsOwner(githubUser, pullRequest) && !userIsReviewer(githubUser, pullRequest, reviews) {
		result <- nil
		return
	}
	reviewers, err := listReviewers(extCtx, githubClient, repository, pullRequest, gitPR.Github.Config.ConfigValues.ListPullRequestReviewersURL)
	if err != nil {
		logger.Error().Err(err).Msg("failed to fetch Github PR reviewers")
		result <- nil
		return
	}
	requestedReviewers, err := getReviewerCount(extCtx, githubClient, repository, pullRequest, reviews, gitPR.Github.Config.ConfigValues.ListPullRequestReviewersURL)
	if err != nil {
		logger.Error().Err(err).Msg("failed to fetch Github PR reviewers")
		result <- nil
		return
	}
	pullRequestFetch, _, err := githubClient.PullRequests.Get(extCtx, *repository.Owner.Login, *repository.Name, *pullRequest.Number)
	if err != nil {
		logger.Error().Err(err).Msg("failed to fetch Github PR")
		result <- nil
		return
	}
	checksDidFail, err := checksDidFail(extCtx, githubClient, repository, pullRequest, gitPR.Github.Config.ConfigValues.ListCheckRunsForRefURL)
	if err != nil {
		logger.Error().Err(err).Msg("failed to fetch Github PR check runs")
		result <- nil
		return
	}
	commentCount, err := getCommentCount(extCtx, githubClient, repository, pullRequest, reviews, gitPR.Github.Config.ConfigValues.ListPullRequestCommentsURL, gitPR.Github.Config.ConfigValues.ListIssueCommentsURL)
	if err != nil {
		logger.Error().Err(err).Msg("failed to fetch Github PR comments")
		result <- nil
		return
	}

	pullRequestData := GithubPRData{
		RequestedReviewers:   requestedReviewers,
		Reviewers:            reviewers,
		IsMergeable:          pullRequestFetch.GetMergeable(),
		IsApproved:           pullRequestIsApproved(reviews),
		HaveRequestedChanges: reviewersHaveRequestedChanges(reviews),
		ChecksDidFail:        checksDidFail,
		IsOwnedByUser:        *pullRequest.User.Login == *githubUser.Login,
		UserLogin:            githubUser.GetLogin(),
	}

	result <- &database.Item{
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
			RepositoryID:   fmt.Sprint(*repository.ID),
			RepositoryName: *repository.Name,
			Number:         *pullRequest.Number,
			Author:         *pullRequest.User.Login,
			Branch:         *pullRequest.Head.Ref,
			RequiredAction: getPullRequestRequiredAction(pullRequestData),
			CommentCount:   commentCount,
			LastUpdatedAt:  primitive.NewDateTimeFromTime(*pullRequest.UpdatedAt),
		},
		TaskType: database.TaskType{
			IsTask:        false,
			IsPullRequest: true,
		},
	}
}

func setOverrideURL(githubClient *github.Client, overrideURL *string) error {
	var err error
	var baseURL *url.URL
	if overrideURL != nil {
		baseURL, err = url.Parse(fmt.Sprintf("%s/", *overrideURL))
		githubClient.BaseURL = baseURL
	}
	return err
}

func getGithubUser(ctx context.Context, githubClient *github.Client, currentlyAuthedUserFilter string, overrideURL *string) (*github.User, error) {
	err := setOverrideURL(githubClient, overrideURL)
	if err != nil {
		return nil, err
	}
	githubUser, _, err := githubClient.Users.Get(ctx, currentlyAuthedUserFilter)
	return githubUser, err
}

func getGithubRepositories(ctx context.Context, githubClient *github.Client, currentlyAuthedUserFilter string, overrideURL *string) ([]*github.Repository, error) {
	err := setOverrideURL(githubClient, overrideURL)
	if err != nil {
		return nil, err
	}
	repositories, _, err := githubClient.Repositories.List(ctx, currentlyAuthedUserFilter, nil)
	return repositories, err
}

func getGithubPullRequests(ctx context.Context, githubClient *github.Client, repository *github.Repository, overrideURL *string) ([]*github.PullRequest, error) {
	err := setOverrideURL(githubClient, overrideURL)
	if err != nil {
		return nil, err
	}
	if repository == nil || repository.Owner == nil || repository.Owner.Login == nil {
		return nil, errors.New("repository is nil")
	}
	fetchedPullRequests, _, err := githubClient.PullRequests.List(ctx, *repository.Owner.Login, *repository.Name, nil)
	return fetchedPullRequests, err
}

func listReviewers(ctx context.Context, githubClient *github.Client, repository *github.Repository, pullRequest *github.PullRequest, overrideURL *string) (*github.Reviewers, error) {
	err := setOverrideURL(githubClient, overrideURL)
	if err != nil {
		return nil, err
	}
	if repository == nil || repository.Owner == nil || repository.Owner.Login == nil {
		return nil, errors.New("repository is nil")
	}
	if pullRequest == nil || pullRequest.Number == nil {
		return nil, errors.New("pull request is nil")
	}
	reviewers, _, err := githubClient.PullRequests.ListReviewers(ctx, *repository.Owner.Login, *repository.Name, *pullRequest.Number, nil)
	return reviewers, err

}

func listComments(context context.Context, githubClient *github.Client, repository *github.Repository, pullRequest *github.PullRequest, overrideURL *string) ([]*github.PullRequestComment, error) {
	err := setOverrideURL(githubClient, overrideURL)
	if err != nil {
		return nil, err
	}
	comments, _, err := githubClient.PullRequests.ListComments(context, *repository.Owner.Login, *repository.Name, *pullRequest.Number, nil)
	return comments, err
}

func listIssueComments(context context.Context, githubClient *github.Client, repository *github.Repository, pullRequest *github.PullRequest, overrideURL *string) ([]*github.IssueComment, error) {
	err := setOverrideURL(githubClient, overrideURL)
	if err != nil {
		return nil, err
	}
	issueComments, _, err := githubClient.Issues.ListComments(context, *repository.Owner.Login, *repository.Name, *pullRequest.Number, nil)
	return issueComments, err
}

func listCheckRunsForCommit(ctx context.Context, githubClient *github.Client, repository *github.Repository, pullRequest *github.PullRequest, overrideURL *string) (*github.ListCheckRunsResults, error) {
	err := setOverrideURL(githubClient, overrideURL)
	if err != nil {
		return nil, err
	}
	checkRuns, _, err := githubClient.Checks.ListCheckRunsForRef(ctx, *repository.Owner.Login, *repository.Name, *pullRequest.Head.SHA, nil)
	return checkRuns, err
}

func userIsOwner(githubUser *github.User, pullRequest *github.PullRequest) bool {
	return (githubUser.ID != nil &&
		pullRequest.User.ID != nil &&
		*githubUser.ID == *pullRequest.User.ID)
}

// Github API does not consider users who have submitted a review as reviewers
func userIsReviewer(githubUser *github.User, pullRequest *github.PullRequest, reviews []*github.PullRequestReview) bool {
	if pullRequest == nil || githubUser == nil {
		return false
	}
	for _, reviewer := range pullRequest.RequestedReviewers {
		if githubUser.ID != nil && reviewer.ID != nil && *githubUser.ID == *reviewer.ID {
			return true
		}
	}
	// If user submitted a review, we consider them a reviewer as well
	for _, review := range reviews {
		if githubUser.GetID() == review.User.GetID() {
			return true
		}
	}
	return false
}

func pullRequestIsApproved(pullRequestReviews []*github.PullRequestReview) bool {
	for _, review := range pullRequestReviews {
		if review.State != nil && *review.State == StateApproved {
			return true
		}
	}
	return false
}

func getCommentCount(context context.Context, githubClient *github.Client, repository *github.Repository, pullRequest *github.PullRequest, reviews []*github.PullRequestReview, overrideURLPRComments *string, overrideURLIssueComments *string) (int, error) {
	if repository == nil {
		return 0, errors.New("repository is nil")
	}
	if pullRequest == nil {
		return 0, errors.New("pull request is nil")
	}
	comments, err := listComments(context, githubClient, repository, pullRequest, overrideURLPRComments)
	if err != nil {
		return 0, err
	}
	issueComments, err := listIssueComments(context, githubClient, repository, pullRequest, overrideURLIssueComments)
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

func getReviewerCount(context context.Context, githubClient *github.Client, repository *github.Repository, pullRequest *github.PullRequest, reviews []*github.PullRequestReview, overrideURL *string) (int, error) {
	if repository == nil {
		return 0, errors.New("repository is nil")
	}
	if pullRequest == nil {
		return 0, errors.New("pull request is nil")
	}
	reviewers, err := listReviewers(context, githubClient, repository, pullRequest, overrideURL)
	if err != nil {
		return 0, err
	}
	submittedReviews := 0
	for _, review := range reviews {
		state := review.GetState()
		if review.GetUser() != nil && (state == StateApproved || state == StateRequestedChanges) {
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
		if review == StateRequestedChanges {
			return true
		}
	}
	return false
}

func checksDidFail(context context.Context, githubClient *github.Client, repository *github.Repository, pullRequest *github.PullRequest, overrideURL *string) (bool, error) {
	if repository == nil {
		return false, errors.New("repository is nil")
	}
	if pullRequest == nil {
		return false, errors.New("pull request is nil")
	}
	checkRuns, err := listCheckRunsForCommit(context, githubClient, repository, pullRequest, overrideURL)
	if err != nil {
		return false, err
	}

	// check runs are individual tests that make up a check suite associated with a commit
	for _, run := range checkRuns.CheckRuns {
		if run.GetStatus() == ChecksStatusCompleted && (run.GetConclusion() == ChecksConclusionFailure || run.GetConclusion() == ChecksConclusionTimedOut) {
			return true, nil
		}
	}
	return false, nil
}

func getPullRequestRequiredAction(data GithubPRData) string {
	var action string
	if data.IsOwnedByUser {
		if !data.IsMergeable {
			action = ActionFixMergeConflicts
		} else if data.ChecksDidFail {
			action = ActionFixFailedCI
		} else if data.RequestedReviewers == 0 {
			action = ActionAddReviewers
		} else if data.HaveRequestedChanges {
			action = ActionAddressRequested
		} else if data.IsApproved {
			action = ActionMergePR
		} else {
			action = ActionWaitingOnReview
		}
	} else {
		reviewerUserIDs := data.Reviewers.Users
		for _, reviewer := range reviewerUserIDs {
			if reviewer.GetLogin() == data.UserLogin {
				action = ActionReviewPR
				break
			}
		}
		if action == "" {
			action = ActionWaitingOnAuthor
		}
	}
	return action
}

func (gitPR GithubPRSource) CreateNewTask(userID primitive.ObjectID, accountID string, task TaskCreationObject) (primitive.ObjectID, error) {
	return primitive.NilObjectID, errors.New("has not been implemented yet")
}

func (gitPR GithubPRSource) CreateNewEvent(userID primitive.ObjectID, accountID string, event EventCreateObject) error {
	return errors.New("has not been implemented yet")
}

func (gitPR GithubPRSource) DeleteEvent(userID primitive.ObjectID, accountID string, externalID string) error {
	return errors.New("has not been implemented yet")
}

func (gitPR GithubPRSource) ModifyTask(userID primitive.ObjectID, accountID string, issueID string, updateFields *database.TaskItemChangeableFields, task *database.Item) error {
	// allow users to mark PR as done in GT even if it's not done in Github
	return nil
}
