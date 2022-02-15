package api

import (
	"context"
	"log"
	"sort"

	"github.com/GeneralTask/task-manager/backend/constants"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func (api *API) TasksListV3(c *gin.Context) {
	parentCtx := c.Request.Context()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}

	defer dbCleanup()
	userID, _ := c.Get("user")
	var userObject database.User
	userCollection := database.GetUserCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = userCollection.FindOne(dbCtx, bson.M{"_id": userID}).Decode(&userObject)

	if err != nil {
		log.Printf("failed to find user: %v", err)
		Handle500(c)
		return
	}

	activeTasks, err := database.GetActiveTasks(db, userID.(primitive.ObjectID))
	if err != nil {
		Handle500(c)
		return
	}
	completedTasks, err := database.GetCompletedTasks(db, userID.(primitive.ObjectID))
	if err != nil {
		Handle500(c)
		return
	}

	allTasks, err := api.mergeTasksV3(
		db,
		activeTasks,
		completedTasks,
		userID.(primitive.ObjectID),
	)
	if err != nil {
		Handle500(c)
		return
	}
	c.JSON(200, allTasks)
}

func (api *API) mergeTasksV3(
	db *mongo.Database,
	activeTasks *[]database.Item,
	completedTasks *[]database.Item,
	userID primitive.ObjectID,
) ([]*TaskSection, error) {
	completedTaskResults := []*TaskResult{}
	for index, task := range *completedTasks {
		taskResult := api.taskBaseToTaskResult(&task.TaskBase)
		taskResult.IDOrdering = index + 1
		completedTaskResults = append(completedTaskResults, taskResult)
	}

	sort.SliceStable(*activeTasks, func(i, j int) bool {
		a := (*activeTasks)[i]
		b := (*activeTasks)[j]
		return a.IDOrdering < b.IDOrdering
	})

	blockedTasks, backlogTasks, todayTasks := api.extractSectionTasksV3(activeTasks)

	err := updateOrderingIDsV2(db, &todayTasks)
	if err != nil {
		return []*TaskSection{}, err
	}

	err = updateOrderingIDsV2(db, &blockedTasks)
	if err != nil {
		return []*TaskSection{}, err
	}

	err = updateOrderingIDsV2(db, &backlogTasks)
	if err != nil {
		return []*TaskSection{}, err
	}

	return []*TaskSection{
		{
			ID:    constants.IDTaskSectionToday,
			Name:  TaskSectionNameToday,
			Tasks: todayTasks,
		},
		{
			ID:    constants.IDTaskSectionBlocked,
			Name:  TaskSectionNameBlocked,
			Tasks: blockedTasks,
		},
		{
			ID:    constants.IDTaskSectionBacklog,
			Name:  TaskSectionNameBacklog,
			Tasks: backlogTasks,
		},
		{
			ID:     constants.IDTaskSectionDone,
			Name:   TaskSectionNameDone,
			Tasks:  completedTaskResults,
			IsDone: true,
		},
	}, nil
}

func (api *API) extractSectionTasksV3(fetchedTasks *[]database.Item) ([]*TaskResult, []*TaskResult, []*TaskResult) {
	blockedTasks := make([]*TaskResult, 0)
	backlogTasks := make([]*TaskResult, 0)
	allOtherTasks := make([]*TaskResult, 0)
	for _, task := range *fetchedTasks {
		if task.IDTaskSection == constants.IDTaskSectionBlocked {
			blockedTasks = append(blockedTasks, api.taskBaseToTaskResult(&task.TaskBase))
			continue
		}
		if task.IDTaskSection == constants.IDTaskSectionBacklog {
			backlogTasks = append(backlogTasks, api.taskBaseToTaskResult(&task.TaskBase))
			continue
		}
		allOtherTasks = append(allOtherTasks, api.taskBaseToTaskResult(&task.TaskBase))
	}
	return blockedTasks, backlogTasks, allOtherTasks
}
