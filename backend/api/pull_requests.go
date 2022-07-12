package api

import (
	"time"

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

type PullRequestResult struct {
	ID          string            `json:"id"`
	Title       string            `json:"title"`
	Number      int               `json:"number"`
	Status      PullRequestStatus `json:"status"`
	Author      string            `json:"author"`
	NumComments int               `json:"num_comments"`
	CreatedAt   string            `json:"created_at"`
	Branch      string            `json:"branch"`
	Deeplink    string            `json:"deeplink"`
}

type PullRequestStatus struct {
	Text  string `json:"text"`
	Color string `json:"color"`
}

func (api *API) PullRequestsList(c *gin.Context) {
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
	pullRequestResults := []PullRequestResult{}
	for _, pullRequest := range *pullRequests {
		pullRequestResults = append(pullRequestResults, PullRequestResult{
			ID:     pullRequest.ID.Hex(),
			Title:  pullRequest.Title,
			Number: pullRequest.Number,
			Status: PullRequestStatus{
				Text:  pullRequest.RequiredAction,
				Color: getColorFromRequiredAction(pullRequest.RequiredAction),
			},
			Author:      pullRequest.Author,
			NumComments: pullRequest.CommentCount,
			CreatedAt:   pullRequest.CreatedAtExternal.Time().Format(time.RFC3339),
			Branch:      pullRequest.Branch,
			Deeplink:    pullRequest.Deeplink,
		})
	}
	c.JSON(200, pullRequestResults)
}

func getColorFromRequiredAction(requiredAction string) string {
	if requiredAction == external.ActionFixMergeConflicts || requiredAction == external.ActionFixFailedCI {
		return PR_COLOR_RED
	} else if requiredAction == external.ActionAddReviewers || requiredAction == external.ActionAddressRequested {
		return PR_COLOR_YELLOW
	} else if requiredAction == external.ActionMergePR {
		return PR_COLOR_GREEN
	}
	return PR_COLOR_GRAY
}
