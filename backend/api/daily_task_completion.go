package api

import (
	"context"
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type DailyTaskCompletionParams struct {
	DatetimeStart *time.Time `form:"datetime_start" binding:"required"`
	DatetimeEnd   *time.Time `form:"datetime_end" binding:"required"`
}

type DailyTaskCompletion struct {
	Date  string `json:"date"`
	Count int    `json:"count"`
}

func (api *API) DailyTaskCompletionList(c *gin.Context) {
	var dailyTaskCompletionParams DailyTaskCompletionParams
	err := c.BindQuery(&dailyTaskCompletionParams)
	if err != nil {
		c.JSON(400, gin.H{"detail": "invalid or missing parameter."})
		return
	}
	userID := getUserIDFromContext(c)
	taskCollection := database.GetTaskCollection(api.DB)

	matchStage := bson.D{
		{Key: "$match", Value: bson.D{
			{Key: "user_id", Value: userID},
			{Key: "is_completed", Value: true},
			{Key: "completed_at", Value: bson.D{
				{Key: "$gte", Value: dailyTaskCompletionParams.DatetimeStart},
				{Key: "$lte", Value: dailyTaskCompletionParams.DatetimeEnd},
			}},
		}},
	}
	projectStage := bson.D{
		{Key: "$project", Value: bson.D{
			{Key: "completed_at_string", Value: bson.D{
				{Key: "$dateToString", Value: bson.D{
					{Key: "format", Value: "%m-%d-%Y"},
					{Key: "date", Value: "$completed_at"},
				}},
			}},
			{Key: "completed_at", Value: "$completed_at"},
		}},
	}
	groupStage := bson.D{
		{Key: "$group", Value: bson.D{
			{Key: "_id", Value: "$completed_at_string"},
			{Key: "completed_at", Value: bson.D{{Key: "$first", Value: "$completed_at"}}},
			{Key: "count", Value: bson.D{{Key: "$sum", Value: 1}}}},
		},
	}
	sortStage := bson.D{
		{Key: "$sort", Value: bson.D{
			{Key: "completed_at", Value: 1},
		}},
	}
	renameFieldsStage := bson.D{
		{Key: "$project", Value: bson.D{
			{Key: "date", Value: "$_id"},
			{Key: "count", Value: 1},
			{Key: "_id", Value: 0},
		}},
	}

	pipeline := mongo.Pipeline{matchStage, projectStage, groupStage, sortStage, renameFieldsStage}
	cursor, err := taskCollection.Aggregate(context.Background(), pipeline)
	if err != nil {
		c.JSON(500, gin.H{"detail": "failed to get daily task completion"})
		return
	}
	var dailyTaskCompletion []DailyTaskCompletion
	if err = cursor.All(context.Background(), &dailyTaskCompletion); err != nil {
		c.JSON(500, gin.H{"detail": "failed to get daily task completion"})
		return
	}
	c.JSON(200, dailyTaskCompletion)
}
