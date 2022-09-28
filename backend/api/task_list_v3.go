package api

import (
	"context"
	"sort"

	"github.com/GeneralTask/task-manager/backend/constants"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func (api *API) TasksListV3(c *gin.Context) {
	userID, _ := c.Get("user")
	var userObject database.User
	userCollection := database.GetUserCollection(api.DB)
	err := userCollection.FindOne(context.Background(), bson.M{"_id": userID}).Decode(&userObject)

	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to find user")
		Handle500(c)
		return
	}

	activeTasks, err := database.GetActiveTasks(api.DB, userID.(primitive.ObjectID))
	if err != nil {
		Handle500(c)
		return
	}
	completedTasks, err := database.GetCompletedTasks(api.DB, userID.(primitive.ObjectID))
	if err != nil {
		Handle500(c)
		return
	}
	deletedTasks, err := database.GetDeletedTasks(api.DB, userID.(primitive.ObjectID))
	if err != nil {
		Handle500(c)
		return
	}

	allTasks, err := api.mergeTasksV3(
		api.DB,
		activeTasks,
		completedTasks,
		deletedTasks,
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
	activeTasks *[]database.Task,
	completedTasks *[]database.Task,
	deletedTasks *[]database.Task,
	userID primitive.ObjectID,
) ([]*TaskSection, error) {
	taskResults := api.taskListToTaskResultList(completedTasks, userID)
	completedTaskResults := []*TaskResult{}
	for index, taskResult := range taskResults {
		taskResult.IDOrdering = index + 1
		completedTaskResults = append(completedTaskResults, taskResult)
	}
	deletedTaskResults := []*TaskResult{}
	for index, task := range *deletedTasks {
		taskResult := api.taskBaseToTaskResult(&task, userID)
		taskResult.IDOrdering = index + 1
		deletedTaskResults = append(deletedTaskResults, taskResult)
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
		Name:   constants.TaskSectionNameDone,
		Tasks:  completedTaskResults,
		IsDone: true,
	})
	sections = append(sections, &TaskSection{
		ID:      constants.IDTaskSectionTrash,
		Name:    constants.TaskSectionNameTrash,
		Tasks:   deletedTaskResults,
		IsTrash: true,
	})
	return sections, nil
}

func (api *API) extractSectionTasksV3(
	db *mongo.Database,
	userID primitive.ObjectID,
	fetchedTasks *[]database.Task,
) ([]*TaskSection, error) {
	userSections, err := database.GetTaskSections(db, userID)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to fetch task sections")
		return []*TaskSection{}, err
	}
	defaultSectionName := database.GetDefaultSectionName(api.DB, userID)
	resultSections := []*TaskSection{
		{
			ID:    constants.IDTaskSectionDefault,
			Name:  defaultSectionName,
			Tasks: []*TaskResult{},
		},
	}
	sort.SliceStable(*userSections, func(i, j int) bool {
		// preserve existing sort if no ordering ID set
		if (*userSections)[i].IDOrdering == 0 && (*userSections)[j].IDOrdering == 0 {
			return (*userSections)[i].ID.Hex() < (*userSections)[j].ID.Hex()
		}
		return (*userSections)[i].IDOrdering < (*userSections)[j].IDOrdering
	})
	for _, userSection := range *userSections {
		resultSections = append(resultSections, &TaskSection{
			ID:    userSection.ID,
			Name:  userSection.Name,
			Tasks: []*TaskResult{},
		})
	}
	// this is inefficient but easy to understand - can optimize later as needed
	taskResults := api.taskListToTaskResultList(fetchedTasks, userID)
	idToTask := make(map[primitive.ObjectID]database.Task)
	for _, task := range *fetchedTasks {
		idToTask[task.ID] = task
	}

	for _, taskResult := range taskResults {
		addedToSection := false
		task, ok := idToTask[taskResult.ID]
		if !ok {
			continue
		}
		for _, resultSection := range resultSections {
			if task.IDTaskSection == resultSection.ID {
				resultSection.Tasks = append(resultSection.Tasks, taskResult)
				addedToSection = true
				break
			}
		}
		if !addedToSection && !taskResult.IsMeetingPreparationTask {
			// add to "Default" section if task section id is not found
			resultSections[0].Tasks = append(resultSections[0].Tasks, taskResult)
		}
	}
	for _, resultSection := range resultSections {
		api.updateOrderingIDsV2(db, &resultSection.Tasks)
	}
	return resultSections, nil
}
