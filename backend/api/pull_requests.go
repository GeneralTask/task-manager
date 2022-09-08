package api

import (
	"context"
	"sort"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/external"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	PR_COLOR_RED    = "red"
	PR_COLOR_YELLOW = "yellow"
	PR_COLOR_GREEN  = "green"
	PR_COLOR_GRAY   = "gray"
)

type RepositoryResult struct {
	ID           string               `json:"id"`
	Name         string               `json:"name"`
	PullRequests []*PullRequestResult `json:"pull_requests"`
}

type PullRequestResult struct {
	ID            string               `json:"id"`
	Title         string               `json:"title"`
	Body          string               `json:"body"`
	Number        int                  `json:"number"`
	Status        PullRequestStatus    `json:"status"`
	Author        string               `json:"author"`
	Comments      []PullRequestComment `json:"comments"`
	NumComments   int                  `json:"num_comments"`
	CreatedAt     string               `json:"created_at"`
	Branch        string               `json:"branch"`
	Deeplink      string               `json:"deeplink"`
	Additions     int                  `json:"additions"`
	Deletions     int                  `json:"deletions"`
	LastUpdatedAt string               `json:"last_updated_at"`
}

type PullRequestComment struct {
	Type            string `json:"type"`
	Body            string `json:"body"`
	Author          string `json:"author"`
	Filepath        string `json:"filepath"`
	LineNumberStart int    `json:"line_number_start"`
	LineNumberEnd   int    `json:"line_number_end"`
	CreatedAt       string `json:"last_updated_at"`
}

type PullRequestStatus struct {
	Text  string `json:"text"`
	Color string `json:"color"`
}

func (api *API) PullRequestsList(c *gin.Context) {
	parentCtx := c.Request.Context()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}

	defer dbCleanup()
	userIDHex, _ := c.Get("user")
	userID := userIDHex.(primitive.ObjectID)

	pullRequests, err := database.GetPullRequests(db, userID, &[]bson.M{{"is_completed": false}})
	if err != nil || pullRequests == nil {
		Handle500(c)
		return
	}

	var repositories []database.Repository
	repositoryCollection := database.GetRepositoryCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	cursor, err := repositoryCollection.Find(
		dbCtx,
		bson.M{"user_id": userID},
	)
	if err != nil {
		Handle500(c)
		return
	}
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	cursor.All(dbCtx, &repositories)

	repositoryIDToResult := make(map[string]RepositoryResult)
	repositoryIDToPullRequests := make(map[string][]*PullRequestResult)
	for _, pullRequest := range *pullRequests {
		repositoryID := pullRequest.RepositoryID
		repositoryResult := RepositoryResult{
			ID:   repositoryID,
			Name: pullRequest.RepositoryName,
		}
		repositoryIDToResult[repositoryID] = repositoryResult
		pullRequestResult := getResultFromPullRequest(pullRequest)
		repositoryIDToPullRequests[repositoryID] = append(repositoryIDToPullRequests[repositoryID], &pullRequestResult)
	}
	repositoryResults := []*RepositoryResult{}

	for repositoryID, repositoryResult := range repositoryIDToResult {
		repositoryResults = append(repositoryResults, &RepositoryResult{
			ID:           repositoryID,
			Name:         repositoryResult.Name,
			PullRequests: repositoryIDToPullRequests[repositoryID],
		})
	}

	// Sort repositories by name
	sort.Slice(repositoryResults, func(i, j int) bool {
		return repositoryResults[i].Name < repositoryResults[j].Name
	})

	// Sort pull requests in repositories by required action, and then by last updated
	for _, repositoryResult := range repositoryResults {
		api.sortPullRequestResults(repositoryResult.PullRequests)
	}
	c.JSON(200, repositoryResults)
}

func (api *API) sortPullRequestResults(prResults []*PullRequestResult) {
	sort.Slice(prResults, func(i, j int) bool {
		leftPR := prResults[i]
		rightPR := prResults[j]
		if leftPR.Status.Text == rightPR.Status.Text {
			return leftPR.LastUpdatedAt > rightPR.LastUpdatedAt
		}
		var ok bool
		var leftPROrdering, rightIDOrdering int
		if leftPROrdering, ok = external.ActionOrdering[leftPR.Status.Text]; !ok {
			api.Logger.Error().Msgf("Invalid Github action: %s", leftPR.Status.Text)
		}
		if rightIDOrdering, ok = external.ActionOrdering[rightPR.Status.Text]; !ok {
			api.Logger.Error().Msgf("Invalid Github action: %s", rightPR.Status.Text)
		}
		return leftPROrdering < rightIDOrdering
	})
}

func getResultFromPullRequest(pullRequest database.PullRequest) PullRequestResult {
	comments := []PullRequestComment{}
	for _, comment := range pullRequest.Comments {
		comments = append(comments, PullRequestComment{
			Type:            comment.Type,
			Body:            comment.Body,
			Author:          comment.Author,
			Filepath:        comment.Filepath,
			LineNumberStart: comment.LineNumberStart,
			LineNumberEnd:   comment.LineNumberEnd,
			CreatedAt:       comment.CreatedAt.Time().UTC().Format(time.RFC3339),
		})
	}
	return PullRequestResult{
		ID:     pullRequest.ID.Hex(),
		Title:  pullRequest.Title,
		Body:   pullRequest.Body,
		Number: pullRequest.Number,
		Status: PullRequestStatus{
			Text:  pullRequest.RequiredAction,
			Color: getColorFromRequiredAction(pullRequest.RequiredAction),
		},
		Author:        pullRequest.Author,
		Comments:      comments,
		NumComments:   pullRequest.CommentCount,
		CreatedAt:     pullRequest.CreatedAtExternal.Time().UTC().Format(time.RFC3339),
		Branch:        pullRequest.Branch,
		Deeplink:      pullRequest.Deeplink,
		Additions:     pullRequest.Additions,
		Deletions:     pullRequest.Deletions,
		LastUpdatedAt: pullRequest.LastUpdatedAt.Time().UTC().Format(time.RFC3339),
	}
}

func getColorFromRequiredAction(requiredAction string) string {
	if requiredAction == external.ActionFixMergeConflicts || requiredAction == external.ActionFixFailedCI {
		return PR_COLOR_RED
	} else if requiredAction == external.ActionAddReviewers || requiredAction == external.ActionAddressComments || requiredAction == external.ActionReviewPR {
		return PR_COLOR_YELLOW
	} else if requiredAction == external.ActionMergePR {
		return PR_COLOR_GREEN
	}
	return PR_COLOR_GRAY
}
