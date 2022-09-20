package api

import (
	"context"
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/slack"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type FeedbackParams struct {
	Feedback string `json:"feedback"`
}

func (api *API) FeedbackAdd(c *gin.Context) {
	var params FeedbackParams
	err := c.BindJSON(&params)
	if err != nil || params.Feedback == "" {
		api.Logger.Error().Err(err).Msg("error")
		c.JSON(400, gin.H{"detail": "invalid or missing 'feedback' parameter."})
		return
	}

	feedbackCollection := database.GetFeedbackItemCollection(api.DB)

	userID, _ := c.Get("user")

	_, err = feedbackCollection.InsertOne(
		context.Background(),
		&database.FeedbackItem{
			UserID:    userID.(primitive.ObjectID),
			Feedback:  params.Feedback,
			CreatedAt: primitive.NewDateTimeFromTime(time.Now()),
		},
	)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to insert feedback item")
		Handle500(c)
		return
	}
	err = slack.SendFeedbackMessage(params.Feedback)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to send slack feedback message")
	}
	c.JSON(201, gin.H{})
}
