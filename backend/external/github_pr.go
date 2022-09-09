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
	ActionNoneNeeded        string = "Not Actionable"
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
	ActionNoneNeeded:        9,
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
	UserTeams   []*github.Team
}

func (gitPR GithubPRSource) GetEvents(db *mongo.Database, userID primitive.ObjectID, accountID string, startTime time.Time, endTime time.Time, result chan<- CalendarResult) {
	result <- emptyCalendarResult(nil)
}

func (gitPR GithubPRSource) GetTasks(db *mongo.Database, userID primitive.ObjectID, accountID string, result chan<- TaskResult) {
	result <- emptyTaskResult(nil)
}

func (gitPR GithubPRSource) GetPullRequests(db *mongo.Database, userID primitive.ObjectID, accountID string, result chan<- PullRequestResult) {
	parentCtx := context.Background()
	logger := logging.GetSentryLogger()

	var githubClient *github.Client
	extCtx, cancel := context.WithTimeout(parentCtx, constants.ExternalTimeout)
	defer cancel()

	var token *oauth2.Token
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

	numRequests := 0
	githubUser, err := getGithubUser(extCtx, githubClient, CurrentlyAuthedUserFilter, gitPR.Github.Config.ConfigValues.GetUserURL)
	numRequests += 1
	if err != nil || githubUser == nil {
		logger.Error().Err(err).Msg("failed to fetch Github user")
		result <- emptyPullRequestResult(errors.New("failed to fetch Github user"))
		return
	}

	userTeams, err := getUserTeams(extCtx, githubClient, gitPR.Github.Config.ConfigValues.ListUserTeamsURL)
	numRequests += 1
	if err != nil {
		logger.Error().Err(err).Msg("failed to fetch Github user teams")
		result <- emptyPullRequestResult(errors.New("failed to fetch Github user teams"))
		return
	}

	repositories, err := getGithubRepositories(extCtx, githubClient, CurrentlyAuthedUserFilter, gitPR.Github.Config.ConfigValues.ListRepositoriesURL)
	numRequests += 1
	if err != nil {
		logger.Error().Err(err).Msg("failed to fetch Github repos for user")
		result <- emptyPullRequestResult(errors.New("failed to fetch Github repos for user"))
		return
	}

	var pullRequests []*database.PullRequest
	var pullRequestChannels []chan *database.PullRequest
	var requestTimes []primitive.DateTime
	for _, repository := range repositories {
		err := updateOrCreateRepository(parentCtx, db, repository, userID, nil)
		if err != nil {
			logger.Error().Err(err).Msg("failed to update or create repository")
			result <- emptyPullRequestResult(err)
			return
		}
		newLastUpdated := primitive.NewDateTimeFromTime(time.Now())
		isListModified := pullRequestListModified(db, parentCtx, userID, token, repository, gitPR.Github.Config.ConfigValues.ListPullRequestsModifiedURL)
		if !isListModified {
			dbPullRequests, err := database.GetPullRequests(db, userID, &[]bson.M{{"repository_id": fmt.Sprint(repository.GetID())}})
			if err != nil {
				logger.Error().Err(err).Msg("failed to load PRs from db")
				result <- emptyPullRequestResult(err)
				return
			}
			for _, dbPullRequest := range *dbPullRequests {
				pullRequests = append(pullRequests, &dbPullRequest)
			}
			continue
		}
		extCtx, cancel = context.WithTimeout(parentCtx, constants.ExternalTimeout)
		defer cancel()
		fetchedPullRequests, err := getGithubPullRequests(extCtx, githubClient, repository, gitPR.Github.Config.ConfigValues.ListPullRequestsURL)
		numRequests += 1
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
				UserTeams:   userTeams,
			}
			requestTimes = append(requestTimes, primitive.NewDateTimeFromTime(time.Now()))
			go gitPR.getPullRequestInfo(db, extCtx, userID, accountID, requestData, pullRequestChan)
			pullRequestChannels = append(pullRequestChannels, pullRequestChan)
		}
		err = updateOrCreateRepository(parentCtx, db, repository, userID, &newLastUpdated)
		if err != nil {
			logger.Error().Err(err).Msg("failed to update or create repository")
			return
		}
	}
	fmt.Println("NUM REQUESTS:", numRequests)

	for index, pullRequestChan := range pullRequestChannels {
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
		pullRequest.LastFetched = requestTimes[index]
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

func (gitPR GithubPRSource) getPullRequestInfo(db *mongo.Database, extCtx context.Context, userID primitive.ObjectID, accountID string, requestData GithubPRRequestData, result chan<- *database.PullRequest) {
	logger := logging.GetSentryLogger()

	githubClient := requestData.Client
	githubUser := requestData.User
	repository := requestData.Repository
	pullRequest := requestData.PullRequest

	// do the check
	hasBeenModified, cachedPR := pullRequestHasBeenModified(db, extCtx, userID, requestData, gitPR.Github.Config.ConfigValues.PullRequestModifiedURL)
	if !hasBeenModified {
		result <- cachedPR
		return
	}

	err := setOverrideURL(githubClient, gitPR.Github.Config.ConfigValues.ListPullRequestReviewURL)
	if err != nil {
		logger.Error().Err(err).Msg("failed to set override url for Github PR reviews")
		result <- nil
		return
	}
	reviews, _, err := githubClient.PullRequests.ListReviews(extCtx, *repository.Owner.Login, *repository.Name, *pullRequest.Number, nil)
	if err != nil {
		logger.Error().Err(err).Msg("failed to fetch Github PR reviews")
		result <- nil
		return
	}

	comments, err := getComments(extCtx, githubClient, repository, pullRequest, reviews, gitPR.Github.Config.ConfigValues.ListPullRequestCommentsURL, gitPR.Github.Config.ConfigValues.ListIssueCommentsURL)
	if err != nil {
		logger.Error().Err(err).Msg("failed to fetch Github PR comments")
		result <- nil
		return
	}

	additions, deletions, err := getAdditionsDeletions(extCtx, githubClient, repository, pullRequest, gitPR.Github.Config.ConfigValues.CompareURL)
	if err != nil {
		logger.Error().Err(err).Msg("failed to fetch Github PR additions / deletions")
		result <- nil
		return
	}

	requiredAction := ActionNoneNeeded
	if userIsOwner(githubUser, pullRequest) || userIsReviewer(githubUser, pullRequest, reviews, requestData.UserTeams) {
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

		requiredAction = getPullRequestRequiredAction(GithubPRData{
			RequestedReviewers:   requestedReviewers,
			Reviewers:            reviewers,
			IsMergeable:          pullRequestFetch.GetMergeable(),
			IsApproved:           pullRequestIsApproved(reviews),
			HaveRequestedChanges: reviewersHaveRequestedChanges(reviews),
			ChecksDidFail:        checksDidFail,
			ChecksDidFinish:      checksDidFinish,
			IsOwnedByUser:        pullRequest.User.GetLogin() == githubUser.GetLogin(),
			UserLogin:            githubUser.GetLogin(),
		})
	}

	result <- &database.PullRequest{
		UserID:            userID,
		IDExternal:        fmt.Sprint(pullRequest.GetID()),
		Deeplink:          pullRequest.GetHTMLURL(),
		SourceID:          TASK_SOURCE_ID_GITHUB_PR,
		Title:             pullRequest.GetTitle(),
		Body:              pullRequest.GetBody(),
		SourceAccountID:   accountID,
		CreatedAtExternal: primitive.NewDateTimeFromTime(pullRequest.GetCreatedAt()),
		RepositoryID:      fmt.Sprint(*repository.ID),
		RepositoryName:    repository.GetFullName(),
		Number:            pullRequest.GetNumber(),
		Author:            pullRequest.User.GetLogin(),
		Branch:            pullRequest.Head.GetRef(),
		RequiredAction:    requiredAction,
		Comments:          comments,
		CommentCount:      len(comments),
		Additions:         additions,
		Deletions:         deletions,
		LastUpdatedAt:     primitive.NewDateTimeFromTime(pullRequest.GetUpdatedAt()),
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

func pullRequestHasBeenModified(db *mongo.Database, ctx context.Context, userID primitive.ObjectID, requestData GithubPRRequestData, overrideURL *string) (bool, *database.PullRequest) {
	logger := logging.GetSentryLogger()

	pullRequest := requestData.PullRequest
	token := requestData.Token
	repository := requestData.Repository

	dbPR, err := database.GetPullRequestByExternalID(db, ctx, fmt.Sprint(*pullRequest.ID), userID)
	if err != nil {
		// if fail to fetch from DB, fetch from Github
		if err != mongo.ErrNoDocuments {
			logger.Error().Err(err).Msg("unable to fetch pull request from db")
		}
		return true, nil
	}

	requestURL := GithubAPIBaseURL + "repos/" + *repository.Owner.Login + "/" + *repository.Name + "/pulls/" + fmt.Sprint(*pullRequest.Number)
	if overrideURL != nil {
		requestURL = *overrideURL
	}

	return isGithubResourceModified(requestURL, token, dbPR.LastFetched.Time()), dbPR
}

func pullRequestListModified(db *mongo.Database, ctx context.Context, userID primitive.ObjectID, token *oauth2.Token, repository *github.Repository, overrideURL *string) bool {
	logger := logging.GetSentryLogger()

	dbRepository, err := getRepository(ctx, db, userID, fmt.Sprint(repository.GetID()))
	if err != nil {
		logger.Error().Err(err).Msg("failed to fetch repository from db")
		return true
	}

	requestURL := GithubAPIBaseURL + "repos/" + *repository.Owner.Login + "/" + *repository.Name + "/pulls"
	if overrideURL != nil {
		requestURL = *overrideURL
	}
	return isGithubResourceModified(requestURL, token, dbRepository.LastUpdatedPullRequests.Time())
}

func isGithubResourceModified(requestURL string, token *oauth2.Token, lastFetched time.Time) bool {
	// Github API does not support conditional requests, so this logic is required
	request, _ := http.NewRequest("GET", requestURL, nil)
	request.Header.Set("Accept", "application/vnd.github+json")
	if token != nil {
		request.Header.Set("Authorization", "token "+token.AccessToken)
	}
	if !lastFetched.IsZero() {
		request.Header.Set("If-Modified-Since", (lastFetched.Format("Mon, 02 Jan 2006 15:04:05 MST")))
	}
	client := &http.Client{}
	resp, err := client.Do(request)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("error with github http request")
		return true
	}

	return (resp.StatusCode != http.StatusNotModified)
}

func getGithubUser(ctx context.Context, githubClient *github.Client, currentlyAuthedUserFilter string, overrideURL *string) (*github.User, error) {
	err := setOverrideURL(githubClient, overrideURL)
	if err != nil {
		return nil, err
	}
	githubUser, _, err := githubClient.Users.Get(ctx, currentlyAuthedUserFilter)
	return githubUser, err
}

func getUserTeams(context context.Context, githubClient *github.Client, overrideURL *string) ([]*github.Team, error) {
	err := setOverrideURL(githubClient, overrideURL)
	if err != nil {
		return nil, err
	}
	userTeams, _, err := githubClient.Teams.ListUserTeams(context, nil)
	return userTeams, err
}

func getGithubRepositories(ctx context.Context, githubClient *github.Client, currentlyAuthedUserFilter string, overrideURL *string) ([]*github.Repository, error) {
	err := setOverrideURL(githubClient, overrideURL)
	if err != nil {
		return nil, err
	}
	// we sort by "pushed" to put the more active repos near the front of the results
	// 30 results are returned by default, which should be enough, but we can increase to 100 if needed
	repositoryListOptions := github.RepositoryListOptions{Sort: "pushed"}
	repositories, _, err := githubClient.Repositories.List(ctx, currentlyAuthedUserFilter, &repositoryListOptions)
	return repositories, err
}

func updateOrCreateRepository(ctx context.Context, db *mongo.Database, repository *github.Repository, userID primitive.ObjectID, lastUpdated *primitive.DateTime) error {
	repositoryCollection := database.GetRepositoryCollection(db)
	dbCtx, cancel := context.WithTimeout(ctx, constants.DatabaseTimeout)
	defer cancel()
	updatedFields := bson.M{
		"full_name": repository.GetFullName(),
		"deeplink":  repository.GetHTMLURL(),
	}
	if lastUpdated != nil {
		updatedFields["last_updated_pull_requests"] = lastUpdated
	}
	_, err := repositoryCollection.UpdateOne(
		dbCtx,
		bson.M{"$and": []bson.M{
			{"repository_id": fmt.Sprint(repository.GetID())},
			{"user_id": userID},
		}},
		bson.M{"$set": bson.M{
			"full_name": repository.GetFullName(),
			"deeplink":  repository.GetHTMLURL(),
		}},
		options.Update().SetUpsert(true),
	)
	return err
}

func getRepository(ctx context.Context, db *mongo.Database, userID primitive.ObjectID, repositoryID string) (database.Repository, error) {
	var repository database.Repository
	err := database.GetRepositoryCollection(db).FindOne(ctx, bson.M{"$and": []bson.M{
		{"repository_id": repositoryID},
		{"user_id": userID},
	}}).Decode(&repository)
	return repository, err
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
func userIsReviewer(githubUser *github.User, pullRequest *github.PullRequest, reviews []*github.PullRequestReview, userTeams []*github.Team) bool {
	if pullRequest == nil || githubUser == nil {
		return false
	}
	for _, reviewer := range pullRequest.RequestedReviewers {
		if githubUser.ID != nil && reviewer.ID != nil && *githubUser.ID == *reviewer.ID {
			return true
		}
	}
	for _, userTeam := range userTeams {
		for _, team := range pullRequest.RequestedTeams {
			if team.ID != nil && userTeam.ID != nil && *team.ID == *userTeam.ID {
				return true
			}
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

func getComments(context context.Context, githubClient *github.Client, repository *github.Repository, pullRequest *github.PullRequest, reviews []*github.PullRequestReview, overrideURLPRComments *string, overrideURLIssueComments *string) ([]database.PullRequestComment, error) {
	if repository == nil {
		return nil, errors.New("repository is nil")
	}
	if pullRequest == nil {
		return nil, errors.New("pull request is nil")
	}
	result := []database.PullRequestComment{}
	comments, err := listComments(context, githubClient, repository, pullRequest, overrideURLPRComments)
	if err != nil {
		return nil, err
	}
	for _, comment := range comments {
		result = append(result, database.PullRequestComment{
			Type:            constants.COMMENT_TYPE_INLINE,
			Body:            comment.GetBody(),
			Author:          comment.User.GetLogin(),
			Filepath:        comment.GetPath(),
			LineNumberStart: comment.GetStartLine(),
			LineNumberEnd:   comment.GetLine(),
			CreatedAt:       primitive.NewDateTimeFromTime(comment.GetCreatedAt()),
		})
	}
	issueComments, err := listIssueComments(context, githubClient, repository, pullRequest, overrideURLIssueComments)
	if err != nil {
		return nil, err
	}
	for _, issueComment := range issueComments {
		result = append(result, database.PullRequestComment{
			Type:      constants.COMMENT_TYPE_TOPLEVEL,
			Body:      issueComment.GetBody(),
			Author:    issueComment.User.GetLogin(),
			CreatedAt: primitive.NewDateTimeFromTime(issueComment.GetCreatedAt()),
		})
	}
	for _, review := range reviews {
		if review.GetBody() == "" {
			continue
		}
		result = append(result, database.PullRequestComment{
			Type:      constants.COMMENT_TYPE_TOPLEVEL,
			Body:      review.GetBody(),
			Author:    review.User.GetLogin(),
			CreatedAt: primitive.NewDateTimeFromTime(review.GetSubmittedAt()),
		})
	}
	return result, nil
}

func getAdditionsDeletions(context context.Context, githubClient *github.Client, repository *github.Repository, pullRequest *github.PullRequest, overrideURLCompare *string) (int, int, error) {
	err := setOverrideURL(githubClient, overrideURLCompare)
	if err != nil {
		return 0, 0, err
	}
	comparison, _, err := githubClient.Repositories.CompareCommits(context, repository.Owner.GetLogin(), repository.GetName(), pullRequest.Base.GetRef(), pullRequest.Head.GetRef(), nil)
	if err != nil {
		return 0, 0, err
	}
	additions := 0
	deletions := 0
	for _, file := range comparison.Files {
		additions += file.GetAdditions()
		deletions += file.GetDeletions()
	}
	return additions, deletions, nil
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
	return submittedReviews + len(reviewers.Users) + len(reviewers.Teams), nil
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

func (gitPR GithubPRSource) CreateNewTask(db *mongo.Database, userID primitive.ObjectID, accountID string, task TaskCreationObject) (primitive.ObjectID, error) {
	return primitive.NilObjectID, errors.New("has not been implemented yet")
}

func (gitPR GithubPRSource) CreateNewEvent(db *mongo.Database, userID primitive.ObjectID, accountID string, event EventCreateObject) error {
	return errors.New("has not been implemented yet")
}

func (gitPR GithubPRSource) DeleteEvent(db *mongo.Database, userID primitive.ObjectID, accountID string, externalID string) error {
	return errors.New("has not been implemented yet")
}

func (gitPR GithubPRSource) ModifyTask(db *mongo.Database, userID primitive.ObjectID, accountID string, issueID string, updateFields *database.Task, task *database.Task) error {
	// allow users to mark PR as done in GT even if it's not done in Github
	return nil
}

func (gitPR GithubPRSource) ModifyEvent(db *mongo.Database, userID primitive.ObjectID, accountID string, eventID string, updateFields *EventModifyObject) error {
	return errors.New("has not been implemented yet")
}
