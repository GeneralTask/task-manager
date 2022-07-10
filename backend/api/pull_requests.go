package api

import (
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
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
				Text: pullRequest.RequiredAction,
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
