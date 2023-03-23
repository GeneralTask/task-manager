package api

import (
	"context"
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


func GetDailyTaskCompletionList(db *mongo.Database, userID primitive.ObjectID, datetimeStart time.Time, dateTimeEnd time.Time) (*[]DailyTaskCompletion, error) {
	taskCollection := database.GetTaskCollection(db)

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
	projectStage := bson.D{
		{Key: "$project", Value: bson.D{
			{Key: "completed_at_string", Value: bson.D{
				{Key: "$dateToString", Value: bson.D{
					{Key: "format", Value: "%Y-%m-%d"},
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
		return nil, err
	}

	var dailyTaskCompletion []DailyTaskCompletion
	if err = cursor.All(context.Background(), &dailyTaskCompletion); err != nil {
		return nil, err
	}
	return &dailyTaskCompletion, nil
}

func (api *API) DailyTaskCompletionList(c *gin.Context) {
	var dailyTaskCompletionParams DailyTaskCompletionParams
	err := c.BindQuery(&dailyTaskCompletionParams)
	if err != nil {
		c.JSON(400, gin.H{"detail": "invalid or missing parameter"})
		return
	}
	userID := getUserIDFromContext(c)
	result, err := GetDailyTaskCompletionList(api.DB, userID, *dailyTaskCompletionParams.DatetimeStart, *dailyTaskCompletionParams.DatetimeEnd)
	if err != nil {
		c.JSON(500, gin.H{"detail": "internal server error"})
		return
	}
	c.JSON(200, result)
}