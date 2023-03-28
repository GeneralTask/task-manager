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

type TaskCompletionSource struct {
	Count    int    `json:"count" bson:"count"`
	SourceID string `json:"source_id" bson:"source_id"`
	Logo     string `json:"logo" bson:"logo"`
}
type DailyTaskCompletion struct {
	Date    string                 `json:"date"`
	Sources []TaskCompletionSource `json:"sources"`
}

func (api *API) GetDailyTaskCompletionList(userID primitive.ObjectID, datetimeStart time.Time, dateTimeEnd time.Time) (*[]DailyTaskCompletion, error) {
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
	// Convert completed_at to string for grouping by date and source
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
	// Group by completed_at_string and source_id
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
	// Sort by source_id so that the sources are in alphabetical order
	sortSourceStage := bson.D{
		{Key: "$sort", Value: bson.D{
			{Key: "_id.source_id", Value: 1},
		}},
	}
	// Group by date string and push all sources with counts
	groupStage2 := bson.D{
		{Key: "$group", Value: bson.D{
			{Key: "_id", Value: "$_id.completed_at_string"},
			{Key: "completed_at", Value: bson.D{{Key: "$first", Value: "$completed_at"}}},
			{Key: "sources", Value: bson.D{
				{Key: "$push", Value: bson.D{
					{Key: "source_id", Value: "$_id.source_id"},
					{Key: "count", Value: "$count"},
				}},
			}},
		}},
	}
	// Sort by completed_at
	sortStage := bson.D{
		{Key: "$sort", Value: bson.D{
			{Key: "completed_at", Value: 1},
		}},
	}
	// Rename _id to date and remove completed_at
	renameFieldsStage2 := bson.D{
		{Key: "$project", Value: bson.D{
			{Key: "date", Value: "$_id"},
			{Key: "sources", Value: 1},
			{Key: "_id", Value: 0},
		}},
	}

	pipeline := mongo.Pipeline{matchStage, projectStage, groupStage, sortSourceStage, groupStage2, sortStage, renameFieldsStage2}
	cursor, err := taskCollection.Aggregate(context.Background(), pipeline)
	if err != nil {
		return nil, err
	}

	var dailyTaskCompletion []DailyTaskCompletion
	if err = cursor.All(context.Background(), &dailyTaskCompletion); err != nil {
		return nil, err
	}
	emptyDailyTaskCompletion := []DailyTaskCompletion{}
	if dailyTaskCompletion == nil {
		dailyTaskCompletion = emptyDailyTaskCompletion
	}
	// Populate source logos
	for i := range dailyTaskCompletion {
		for j, source := range dailyTaskCompletion[i].Sources {
			taskSourceResult, err := api.ExternalConfig.GetSourceResult(source.SourceID)
			if err != nil {
				return &emptyDailyTaskCompletion, err
			}
			dailyTaskCompletion[i].Sources[j].Logo = taskSourceResult.Details.LogoV2
		}
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
	result, err := api.GetDailyTaskCompletionList(userID, *dailyTaskCompletionParams.DatetimeStart, *dailyTaskCompletionParams.DatetimeEnd)
	if err != nil {
		c.JSON(500, gin.H{"detail": "internal server error"})
		return
	}
	c.JSON(200, result)
}
