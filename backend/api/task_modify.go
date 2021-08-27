package api

import (
	"context"
	"errors"
	"log"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TaskModifyParams struct {
	IDOrdering    *int    `json:"id_ordering"`
	IDTaskSection *string `json:"id_task_section"`
	IsCompleted   *bool   `json:"is_completed"`
}

func (api *API) TaskModify(c *gin.Context) {
	taskIDHex := c.Param("task_id")
	taskID, err := primitive.ObjectIDFromHex(taskIDHex)
	if err != nil {
		// This means the task ID is improperly formatted
		Handle404(c)
		return
	}
	var modifyParams TaskModifyParams
	err = c.BindJSON(&modifyParams)

	if err != nil || (modifyParams.IsCompleted == nil && modifyParams.IDOrdering == nil && modifyParams.IDTaskSection == nil) {
		c.JSON(400, gin.H{"detail": "Parameter missing or malformatted"})
		return
	}

	if modifyParams.IDTaskSection != nil {
		IDTaskSection, err := primitive.ObjectIDFromHex(*modifyParams.IDTaskSection)
		if err != nil || (IDTaskSection != constants.IDTaskSectionToday && IDTaskSection != constants.IDTaskSectionBlocked && IDTaskSection != constants.IDTaskSectionBacklog) {
			c.JSON(400, gin.H{"detail": "'id_task_section' is not a valid ID"})
			return
		}
	}

	if modifyParams.IsCompleted != nil && modifyParams.IDOrdering != nil {
		c.JSON(400, gin.H{"detail": "Cannot reorder and mark as complete"})
		return
	}

	userIDRaw, _ := c.Get("user")
	userID := userIDRaw.(primitive.ObjectID)

	if modifyParams.IsCompleted != nil {
		if *modifyParams.IsCompleted {
			MarkTaskComplete(api, c, taskID, userID)
		} else {
			c.JSON(400, gin.H{"detail": "Tasks can only be marked as complete."})
		}
	} else if modifyParams.IDOrdering != nil || modifyParams.IDTaskSection != nil {
		ReOrderTask(c, taskID, userID, modifyParams.IDOrdering, modifyParams.IDTaskSection)
	} else {
		c.JSON(400, gin.H{"detail": "Parameter missing or malformatted"})
		return
	}

}

func ReOrderTask(c *gin.Context, taskID primitive.ObjectID, userID primitive.ObjectID, IDOrdering *int, IDTaskSectionHex *string) {
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()
	taskCollection := db.Collection("tasks")
	updateParams := bson.M{"has_been_reordered": true}
	if IDOrdering != nil {
		updateParams["id_ordering"] = *IDOrdering
	}
	var IDTaskSection primitive.ObjectID
	if IDTaskSectionHex != nil {
		IDTaskSection, _ = primitive.ObjectIDFromHex(*IDTaskSectionHex)
		updateParams["id_task_section"] = IDTaskSection
	} else {
		var task database.TaskBase
		err = taskCollection.FindOne(context.TODO(), bson.M{"_id": taskID}).Decode(&task)
		if err != nil {
			log.Printf("failed to load task in db: %v", err)
		}
		IDTaskSection = task.IDTaskSection
	}
	result, err := taskCollection.UpdateOne(
		context.TODO(),
		bson.M{"$and": []bson.M{
			{"_id": taskID},
			{"user_id": userID},
		}},
		bson.M{"$set": updateParams},
	)
	if err != nil {
		log.Printf("failed to update task in db: %v", err)
		Handle500(c)
		return
	}
	if result.MatchedCount != 1 {
		Handle404(c)
		return
	}
	// Move back other tasks to ensure ordering is preserved (gaps are removed in GET task list)
	_, err = taskCollection.UpdateMany(
		context.TODO(),
		bson.M{"$and": []bson.M{
			{"_id": bson.M{"$ne": taskID}},
			{"id_ordering": bson.M{"$gte": IDOrdering}},
			{"id_task_section": IDTaskSection},
			{"user_id": userID},
		}},
		bson.M{"$inc": bson.M{"id_ordering": 1}},
	)
	if err != nil {
		log.Printf("failed to move back other tasks in db: %v", err)
		Handle500(c)
		return
	}
	c.JSON(200, gin.H{})
}

func MarkTaskComplete(api *API, c *gin.Context, taskID primitive.ObjectID, userID primitive.ObjectID) {
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()
	taskCollection := db.Collection("tasks")

	var task database.TaskBase
	if taskCollection.FindOne(
		context.TODO(),
		bson.M{"$and": []bson.M{
			{"_id": taskID},
			{"user_id": userID},
		}}).Decode(&task) != nil {
		c.JSON(404, gin.H{"detail": "Task not found.", "taskId": taskID})
		return
	}

	if task.Source.Name == database.TaskSourceGoogleCalendar.Name {
		err = errors.New("invalid task type")
	} else if task.Source.Name == database.TaskSourceGmail.Name {
		gmail := external.GmailSource{Google: external.GoogleService{
			Config:       api.GoogleConfig,
			OverrideURLs: api.GoogleOverrideURLs,
		}}
		err = gmail.MarkAsDone(userID, task.SourceAccountID, task.IDExternal)
	} else if task.Source.Name == database.TaskSourceJIRA.Name {
		JIRA := external.JIRASource{Atlassian: external.AtlassianService{Config: api.AtlassianConfig}}
		err = JIRA.MarkAsDone(userID, task.SourceAccountID, task.IDExternal)
	}

	if err == nil {
		_, err := taskCollection.UpdateOne(context.TODO(), bson.M{"_id": taskID}, bson.M{"$set": bson.M{"is_completed": true}})
		if err != nil {
			log.Printf("failed to update internal DB with completion status: %v", err)
			Handle500(c)
			return
		}
		c.JSON(200, gin.H{})
	} else {
		c.JSON(400, gin.H{"detail": "Failed to mark task as complete"})
	}
}
