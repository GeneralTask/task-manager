package api

import (
	"context"
	"fmt"
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
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

func (api *API) GetDailyTaskCompletionList(userID primitive.ObjectID, datetimeStart time.Time, dateTimeEnd time.Time) ([]bson.M, error) {
	taskCollection := database.GetTaskCollection(api.DB)

	// Get all tasks completed between datetimeStart and dateTimeEnd
	matchStage := bson.D{
		{Key: "$match", Value: bson.D{
			{Key: "user_id", Value: userID},
			{Key: "is_completed", Value: true},
			{Key: "completed_at", Value: bson.D{
				{Key: "$gte", Value: datetimeStart},
				{Key: "$lte", Value: dateTimeEnd},
			}},
		}},
	}
	// Convert completed_at to string for grouping
	projectStage := bson.D{
		{Key: "$project", Value: bson.D{
			{Key: "completed_at_string", Value: bson.D{
				{Key: "$dateToString", Value: bson.D{
					{Key: "format", Value: "%Y-%m-%d"},
					{Key: "date", Value: "$completed_at"},
				}},
			}},
			{Key: "completed_at", Value: "$completed_at"},
			{Key: "source_id", Value: "$source_id"},
		}},
	}
	// Group by completed_at_string and count
	groupStage := bson.D{
		{Key: "$group", Value: bson.D{
			{Key: "_id", Value: bson.D{
				{Key: "completed_at_string", Value: "$completed_at_string"},
				{Key: "source_id", Value: "$source_id"},
			}},
			{Key: "completed_at", Value: bson.D{{Key: "$first", Value: "$completed_at"}}},
			{Key: "count", Value: bson.D{{Key: "$sum", Value: 1}}}},
		},
	}
	// Sort by completed_at
	sortStage := bson.D{
		{Key: "$sort", Value: bson.D{
			{Key: "completed_at", Value: 1},
		}},
	}
	// Rename _id to date
	renameFieldsStage := bson.D{
		{Key: "$project", Value: bson.D{
			{Key: "date", Value: "$_id.completed_at_string"},
			{Key: "source_id", Value: "$_id.source_id"},
			{Key: "count", Value: 1},
			{Key: "_id", Value: 0},
		}},
	}
	// Group by date string
	groupStage2 := bson.D{
		{Key: "$group", Value: bson.D{
			{Key: "_id", Value: "$date"},
			{Key: "sources", Value: bson.D{
				{Key: "$push", Value: bson.D{
					{Key: "source_id", Value: "$source_id"},
					{Key: "count", Value: "$count"},
				}},
			}},
		}},
	}

	pipeline := mongo.Pipeline{matchStage, projectStage, groupStage, sortStage, renameFieldsStage, groupStage2}
	cursor, err := taskCollection.Aggregate(context.Background(), pipeline)
	if err != nil {
		return nil, err
	}

	var result []bson.M
	if err = cursor.All(context.Background(), &result); err != nil {
		fmt.Println(err)
		return nil, err
	}
	return result, nil

	// var dailyTaskCompletion []DailyTaskCompletion
	// if err = cursor.All(context.Background(), &dailyTaskCompletion); err != nil {
	// 	return nil, err
	// }
	// if dailyTaskCompletion == nil {
	// 	dailyTaskCompletion = []DailyTaskCompletion{}
	// }
	// return &dailyTaskCompletion, nil
}

func (api *API) DailyTaskCompletionList(c *gin.Context) {
	var dailyTaskCompletionParams DailyTaskCompletionParams
	err := c.BindQuery(&dailyTaskCompletionParams)
	if err != nil {
		c.JSON(400, gin.H{"detail": "invalid or missing parameter"})
		return
	}
	userID := getUserIDFromContext(c)
	result, err := api.GetDailyTaskCompletionList(userID, *dailyTaskCompletionParams.DatetimeStart, *dailyTaskCompletionParams.DatetimeEnd)
	if err != nil {
		c.JSON(500, gin.H{"detail": "internal server error"})
		return
	}
	c.JSON(200, result)
}
