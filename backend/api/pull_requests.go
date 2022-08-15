package api

import (
	"context"
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
	ID           string              `json:"id"`
	Name         string              `json:"name"`
	PullRequests []PullRequestResult `json:"pull_requests"`
}

type PullRequestResult struct {
	ID            string            `json:"id"`
	Title         string            `json:"title"`
	Number        int               `json:"number"`
	Status        PullRequestStatus `json:"status"`
	Author        string            `json:"author"`
	NumComments   int               `json:"num_comments"`
	CreatedAt     string            `json:"created_at"`
	Branch        string            `json:"branch"`
	Deeplink      string            `json:"deeplink"`
	LastUpdatedAt string            `json:"last_updated_at"`
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

	pullRequests, err := database.GetItems(db, userID, &[]bson.M{
		{"is_completed": false},
		{"task_type.is_pull_request": true},
	})
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

	repositoryResults := []RepositoryResult{}
	for _, repository := range repositories {
		result := RepositoryResult{
			ID:           repository.ID.Hex(),
			Name:         repository.FullName,
			PullRequests: []PullRequestResult{},
		}
		for _, pullRequest := range *pullRequests {
			if pullRequest.RepositoryID == repository.RepositoryID {
				result.PullRequests = append(result.PullRequests, PullRequestResult{
					ID:     pullRequest.ID.Hex(),
					Title:  pullRequest.Title,
					Number: pullRequest.Number,
					Status: PullRequestStatus{
						Text:  pullRequest.RequiredAction,
						Color: getColorFromRequiredAction(pullRequest.RequiredAction),
					},
					Author:        pullRequest.Author,
					NumComments:   pullRequest.CommentCount,
					CreatedAt:     pullRequest.CreatedAtExternal.Time().UTC().Format(time.RFC3339),
					Branch:        pullRequest.Branch,
					Deeplink:      pullRequest.Deeplink,
					LastUpdatedAt: pullRequest.PullRequest.LastUpdatedAt.Time().UTC().Format(time.RFC3339),
				})

			}
		}
		if len(result.PullRequests) == 0 {
			continue
		}
		repositoryResults = append(repositoryResults, result)
	}

	c.JSON(200, repositoryResults)
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
