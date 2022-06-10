package api

import (
	"context"
	"sort"

	"github.com/rs/zerolog/log"

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
		log.Error().Err(err).Msg("failed to find user")
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
		taskResult := api.taskBaseToTaskResult(&task, userID)
		taskResult.IDOrdering = index + 1
		completedTaskResults = append(completedTaskResults, taskResult)
	}

	sort.SliceStable(*activeTasks, func(i, j int) bool {
		a := (*activeTasks)[i]
		b := (*activeTasks)[j]
		return a.IDOrdering < b.IDOrdering
	})

	sections, err := api.extractSectionTasksV3(db, userID, activeTasks)
	if err != nil {
		return []*TaskSection{}, err
	}
	sections = append(sections, &TaskSection{
		ID:     constants.IDTaskSectionDone,
		Name:   TaskSectionNameDone,
		Tasks:  completedTaskResults,
		IsDone: true,
	})
	return sections, nil
}

func (api *API) extractSectionTasksV3(
	db *mongo.Database,
	userID primitive.ObjectID,
	fetchedTasks *[]database.Item,
) ([]*TaskSection, error) {
	userSections, err := database.GetTaskSections(db, userID)
	if err != nil {
		log.Error().Err(err).Msg("failed to fetch task sections")
		return []*TaskSection{}, err
	}
	resultSections := []*TaskSection{
		{
			ID:    constants.IDTaskSectionDefault,
			Name:  TaskSectionNameDefault,
			Tasks: []*TaskResult{},
		},
	}
	for _, userSection := range *userSections {
		resultSections = append(resultSections, &TaskSection{
			ID:    userSection.ID,
			Name:  userSection.Name,
			Tasks: []*TaskResult{},
		})
	}
	// this is inefficient but easy to understand - can optimize later as needed
	for _, task := range *fetchedTasks {
		taskResult := api.taskBaseToTaskResult(&task, userID)
		addedToSection := false
		for _, resultSection := range resultSections {
			if task.IDTaskSection == resultSection.ID {
				resultSection.Tasks = append(resultSection.Tasks, taskResult)
				addedToSection = true
				break
			}
		}
		if !addedToSection {
			// add to "Today" section if task section id is not found
			resultSections[0].Tasks = append(resultSections[0].Tasks, taskResult)
		}
	}
	for _, resultSection := range resultSections {
		updateOrderingIDsV2(db, &resultSection.Tasks)
	}
	return resultSections, nil
}
