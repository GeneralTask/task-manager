package external

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/GeneralTask/task-manager/backend/logging"
	"golang.org/x/oauth2"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/google/go-github/v45/github"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const (
	CurrentlyAuthedUserFilter string = ""
	RepoOwnerTypeOrganization string = "Organization"
	StateApproved             string = "APPROVED"
	StateChangesRequested     string = "CHANGES_REQUESTED"
	StateCommented            string = "COMMENTED"
)

// *Important*: Add all required actions to the ActionOrdering map so that the PRs are ordered correctly
const (
	ActionAddReviewers      string = "Add Reviewers"
	ActionFixMergeConflicts string = "Fix Merge Conflicts"
	ActionFixFailedCI       string = "Fix Failed CI"
	ActionAddressComments   string = "Address Comments"
	ActionWaitingOnCI       string = "Waiting on CI"
	ActionMergePR           string = "Merge PR"
	ActionWaitingOnAuthor   string = "Waiting on Author"
	ActionWaitingOnReview   string = "Waiting on Review"
	ActionReviewPR          string = "Review PR"
)

var ActionOrdering = map[string]int{
	ActionReviewPR:          0,
	ActionAddReviewers:      1,
	ActionFixFailedCI:       2,
	ActionAddressComments:   3,
	ActionFixMergeConflicts: 4,
	ActionWaitingOnCI:       5,
	ActionMergePR:           6,
	ActionWaitingOnReview:   7,
	ActionWaitingOnAuthor:   8,
}

const (
	ChecksStatusCompleted    string = "completed"
	ChecksConclusionFailure  string = "failure"
	ChecksConclusionTimedOut string = "timed_out"
)

const (
	GithubAPIBaseURL string = "https://api.github.com/"
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
	ChecksDidFinish      bool
	IsOwnedByUser        bool
	UserLogin            string
}

type GithubPRRequestData struct {
	Client      *github.Client
	User        *github.User
	Repository  *github.Repository
	PullRequest *github.PullRequest
	Token       *oauth2.Token
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

	var token *oauth2.Token
	if gitPR.Github.Config.ConfigValues.FetchExternalAPIToken != nil && *gitPR.Github.Config.ConfigValues.FetchExternalAPIToken {
		externalAPITokenCollection := database.GetExternalTokenCollection(db)
		token, err = GetGithubToken(externalAPITokenCollection, userID, accountID)
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

	var pullRequestChannels []chan *database.PullRequest
	var requestTimes []primitive.DateTime
	for _, repository := range repositories {
		err := updateOrCreateRepository(parentCtx, db, repository, userID)
		if err != nil {
			logger.Error().Err(err).Msg("failed to update or create repository")
			result <- emptyPullRequestResult(err)
			return
		}
		extCtx, cancel = context.WithTimeout(parentCtx, constants.ExternalTimeout)
		defer cancel()
		fetchedPullRequests, err := getGithubPullRequests(extCtx, githubClient, repository, gitPR.Github.Config.ConfigValues.ListPullRequestsURL)
		if err != nil && !strings.Contains(err.Error(), "404 Not Found") {
			result <- emptyPullRequestResult(errors.New("failed to fetch Github PRs"))
			return
		}
		for _, pullRequest := range fetchedPullRequests {
			pullRequestChan := make(chan *database.PullRequest)
			requestData := GithubPRRequestData{
				Client:      githubClient,
				User:        githubUser,
				Repository:  repository,
				PullRequest: pullRequest,
				Token:       token,
			}
			requestTimes = append(requestTimes, primitive.NewDateTimeFromTime(time.Now()))
			go gitPR.getPullRequestInfo(extCtx, userID, accountID, requestData, pullRequestChan)
			pullRequestChannels = append(pullRequestChannels, pullRequestChan)
		}
	}

	var pullRequests []*database.PullRequest
	for count, pullRequestChan := range pullRequestChannels {
		pullRequest := <-pullRequestChan
		// if nil, this means that the request ran into an error: continue and keep processing the rest
		if pullRequest == nil {
			continue
		}

		// don't update or create if pull request has DB ID already (it's a cached PR from the DB)
		if pullRequest.ID != primitive.NilObjectID {
			pullRequests = append(pullRequests, pullRequest)
			continue
		}

		isCompleted := false
		pullRequest.IsCompleted = &isCompleted
		pullRequest.LastFetched = requestTimes[count]
		dbPR, err := database.UpdateOrCreatePullRequest(
			db,
			userID,
			string(pullRequest.IDExternal),
			pullRequest.SourceID,
			pullRequest,
			nil)
		if err != nil {
			logger.Error().Err(err).Msg("failed to update or create pull request")
			result <- emptyPullRequestResult(err)
			return
		}
		pullRequest.ID = dbPR.ID
		pullRequest.IDOrdering = dbPR.IDOrdering

		pullRequests = append(pullRequests, pullRequest)
	}

	result <- PullRequestResult{
		PullRequests: pullRequests,
		Error:        nil,
	}
}

func (gitPR GithubPRSource) getPullRequestInfo(extCtx context.Context, userID primitive.ObjectID, accountID string, requestData GithubPRRequestData, result chan<- *database.PullRequest) {
	logger := logging.GetSentryLogger()

	githubClient := requestData.Client
	githubUser := requestData.User
	repository := requestData.Repository
	pullRequest := requestData.PullRequest

	// do the check
	hasBeenModified, cachedPR := pullRequestHasBeenModified(extCtx, userID, requestData, gitPR.Github.Config.ConfigValues.PullRequestModifiedURL)
	if !hasBeenModified {
		result <- cachedPR
		return
	}

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
	// check runs are individual tests that make up a check suite associated with a commit
	checkRunsForCommit, err := listCheckRunsForCommit(extCtx, githubClient, repository, pullRequest, gitPR.Github.Config.ConfigValues.ListCheckRunsForRefURL)
	if err != nil {
		logger.Error().Err(err).Msg("failed to fetch Github PR check runs")
		result <- nil
		return
	}
	checksDidFail := checkRunsDidFail(checkRunsForCommit)
	checksDidFinish := checkRunsDidFinish(checkRunsForCommit)
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
		ChecksDidFinish:      checksDidFinish,
		IsOwnedByUser:        *pullRequest.User.Login == *githubUser.Login,
		UserLogin:            githubUser.GetLogin(),
	}

	result <- &database.PullRequest{
		UserID:            userID,
		IDExternal:        fmt.Sprint(*pullRequest.ID),
		Deeplink:          *pullRequest.HTMLURL,
		SourceID:          TASK_SOURCE_ID_GITHUB_PR,
		Title:             *pullRequest.Title,
		SourceAccountID:   accountID,
		CreatedAtExternal: primitive.NewDateTimeFromTime(*pullRequest.CreatedAt),
		RepositoryID:      fmt.Sprint(*repository.ID),
		RepositoryName:    *repository.Name,
		Number:            *pullRequest.Number,
		Author:            *pullRequest.User.Login,
		Branch:            *pullRequest.Head.Ref,
		RequiredAction:    getPullRequestRequiredAction(pullRequestData),
		CommentCount:      commentCount,
		LastUpdatedAt:     primitive.NewDateTimeFromTime(*pullRequest.UpdatedAt),
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

func pullRequestHasBeenModified(ctx context.Context, userID primitive.ObjectID, requestData GithubPRRequestData, overrideURL *string) (bool, *database.PullRequest) {
	logger := logging.GetSentryLogger()

	pullRequest := requestData.PullRequest
	token := requestData.Token
	repository := requestData.Repository

	dbPR, err := database.GetPullRequestByExternalID(ctx, fmt.Sprint(*pullRequest.ID), userID)
	if err != nil {
		// if fail to fetch from DB, fetch from Githubb
		logger.Error().Err(err).Msg("unable to fetch pull request from db")
		return true, nil
	}

	requestURL := GithubAPIBaseURL + "repos/" + *repository.Owner.Login + "/" + *repository.Name + "/pulls/" + fmt.Sprint(*pullRequest.Number)
	if overrideURL != nil {
		requestURL = *overrideURL
	}

	// Github API does not support conditional requests, so this logic is required
	request, _ := http.NewRequest("GET", requestURL, nil)
	request.Header.Set("Accept", "application/vnd.github+json")
	if token != nil {
		request.Header.Set("Authorization", "token "+token.AccessToken)
	}
	if !dbPR.LastFetched.Time().IsZero() {
		request.Header.Set("If-Modified-Since", (dbPR.LastFetched.Time().Format("Mon, 02 Jan 2006 15:04:05 MST")))
	}
	client := &http.Client{}
	resp, err := client.Do(request)
	if err != nil {
		logger.Error().Err(err).Msg("error with github http request")
		return true, dbPR
	}

	return (resp.StatusCode != http.StatusNotModified), dbPR
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

func updateOrCreateRepository(ctx context.Context, db *mongo.Database, repository *github.Repository, userID primitive.ObjectID) error {
	repositoryCollection := database.GetRepositoryCollection(db)
	dbCtx, cancel := context.WithTimeout(ctx, constants.DatabaseTimeout)
	defer cancel()
	_, err := repositoryCollection.UpdateOne(
		dbCtx,
		bson.M{"$and": []bson.M{
			{"repository_id": fmt.Sprint(repository.GetID())},
			{"user_id": userID},
		}},
		bson.M{"$set": bson.M{
			"full_name": repository.GetName(),
			"deeplink":  repository.GetHTMLURL(),
		}},
		options.Update().SetUpsert(true),
	)
	return err
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
		if review.GetUser() != nil && (state == StateApproved || state == StateChangesRequested) {
			submittedReviews += 1
		}
	}
	return submittedReviews + len(reviewers.Users), nil
}

func reviewersHaveRequestedChanges(reviews []*github.PullRequestReview) bool {
	userToMostRecentReview := make(map[string]string)
	for _, review := range reviews {
		reviewState := review.GetState()
		// If a user requests changes, and then leaves a comment, the PR is still in the 'changes requested' state.
		if reviewState == StateCommented {
			continue
		}
		userToMostRecentReview[review.GetUser().GetLogin()] = reviewState
	}
	for _, review := range userToMostRecentReview {
		if review == StateChangesRequested {
			return true
		}
	}
	return false
}

func checkRunsDidFinish(checkRuns *github.ListCheckRunsResults) bool {
	for _, checkRun := range checkRuns.CheckRuns {
		if checkRun.GetStatus() != ChecksStatusCompleted {
			return false
		}
	}
	return true
}

func checkRunsDidFail(checkRuns *github.ListCheckRunsResults) bool {
	for _, run := range checkRuns.CheckRuns {
		if run.GetStatus() == ChecksStatusCompleted && (run.GetConclusion() == ChecksConclusionFailure || run.GetConclusion() == ChecksConclusionTimedOut) {
			return true
		}
	}
	return false
}

func getPullRequestRequiredAction(data GithubPRData) string {
	var action string
	if data.IsOwnedByUser {
		if data.RequestedReviewers == 0 {
			action = ActionAddReviewers
		} else if data.ChecksDidFail {
			action = ActionFixFailedCI
		} else if data.HaveRequestedChanges {
			action = ActionAddressComments
		} else if !data.IsMergeable {
			action = ActionFixMergeConflicts
		} else if !data.ChecksDidFinish {
			action = ActionWaitingOnCI
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

func (gitPR GithubPRSource) ModifyTask(userID primitive.ObjectID, accountID string, issueID string, updateFields *database.Task, task *database.Task) error {
	// allow users to mark PR as done in GT even if it's not done in Github
	return nil
}

func (gitPR GithubPRSource) ModifyEvent(userID primitive.ObjectID, accountID string, eventID string, updateFields *EventModifyObject) error {
	return errors.New("has not been implemented yet")
}
