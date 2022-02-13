package api

import (
	"context"
	"log"
	"sort"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/external"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)


func (api *API) TasksFetch(c *gin.Context) {
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

	currentTasks, err := database.GetActiveTasks(db, userID.(primitive.ObjectID))
	if err != nil {
		Handle500(c)
		return
	}

	fetchedTasks, err := api.fetchTasks(parentCtx, db, userID)
	if err != nil {
		Handle500(c)
		return
	}
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	_, err = userCollection.UpdateOne(
		dbCtx,
		bson.M{"_id": userID},
		bson.M{"$set": bson.M{"last_refreshed": primitive.NewDateTimeFromTime(time.Now())}},
	)
	if err != nil {
		log.Printf("failed to update user last_refreshed: %v", err)
	}

	allTasks, err := api.mergeTasks(
		db,
		currentTasks,
		fetchedTasks,
		userID.(primitive.ObjectID),
	)
	if err != nil {
		Handle500(c)
		return
	}
	c.JSON(200, allTasks)
}

func (api *API) mergeTasks(
	db *mongo.Database,
	currentTasks *[]database.Item,
	fetchedTasks *[]*database.Item,
	userID primitive.ObjectID,
) ([]*TaskSection, error) {
	err := adjustForCompletedTasks(db, currentTasks, fetchedTasks)
	if err != nil {
		return []*TaskSection{}, err
	}

	completedTasks, err := database.GetCompletedTasks(db, userID)
	if err != nil {
		return []*TaskSection{}, err
	}
	completedTaskResults := []*TaskResult{}
	for index, task := range *completedTasks {
		taskResult := api.taskBaseToTaskResult(&task.TaskBase)
		taskResult.IDOrdering = index + 1
		completedTaskResults = append(completedTaskResults, taskResult)
	}

	sort.SliceStable(*fetchedTasks, func(i, j int) bool {
		a := (*fetchedTasks)[i]
		b := (*fetchedTasks)[j]
		return a.IDOrdering < b.IDOrdering
	})

	blockedTasks, backlogTasks, todayTasks := api.extractSectionTasksV2(fetchedTasks)

	err = updateOrderingIDsV2(db, &todayTasks)
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

func (api *API) extractSectionTasksV2(fetchedTasks *[]*database.Item) ([]*TaskResult, []*TaskResult, []*TaskResult) {
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

func adjustForCompletedTasks(
	db *mongo.Database,
	currentTasks *[]database.Item,
	fetchedTasks *[]*database.Item,
) error {
	// decrements IDOrdering for tasks behind newly completed tasks
	var newTasks []*database.TaskBase
	newTaskIDs := make(map[primitive.ObjectID]bool)
	for _, fetchedTask := range *fetchedTasks {
		taskBase := fetchedTask.TaskBase
		newTasks = append(newTasks, &taskBase)
		newTaskIDs[taskBase.ID] = true
	}
	// There's a more efficient way to do this but this way is easy to understand
	for _, currentTask := range *currentTasks {
		if !newTaskIDs[currentTask.ID] {
			err := database.MarkItemComplete(db, currentTask.ID)
			if err != nil {
				log.Printf("failed to update task ordering ID: %v", err)
				return err
			}
			for _, newTask := range newTasks {
				if newTask.IDOrdering > currentTask.IDOrdering {
					newTask.IDOrdering -= 1
				}
			}
		}
	}
	return nil
}

func updateOrderingIDsV2(db *mongo.Database, tasks *[]*TaskResult) error {
	parentCtx := context.Background()
	tasksCollection := database.GetTaskCollection(db)
	orderingID := 1
	for _, task := range *tasks {
		task.IDOrdering = orderingID
		orderingID += 1
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		res, err := tasksCollection.UpdateOne(
			dbCtx,
			bson.M{"_id": task.ID},
			bson.M{"$set": bson.M{"id_ordering": task.IDOrdering}},
		)
		if err != nil {
			log.Printf("failed to update task ordering ID: %v", err)
			return err
		}
		if res.MatchedCount != 1 {
			log.Printf("did not find task to update ordering ID (ID=%v)", task.ID)
		}
	}
	return nil
}

func (api *API) taskBaseToTaskResult(t *database.TaskBase) *TaskResult {
	taskSourceResult, _ := api.ExternalConfig.GetTaskSourceResult(t.SourceID)
	var dueDate string
	if t.DueDate.Time().Unix() == int64(0) {
		dueDate = ""
	} else {
		dueDate = t.DueDate.Time().Format("2006-01-02")
	}
	return &TaskResult{
		ID:         t.ID,
		IDOrdering: t.IDOrdering,
		Source: TaskSource{
			Name:          taskSourceResult.Details.Name,
			Logo:          taskSourceResult.Details.Logo,
			IsCompletable: taskSourceResult.Details.IsCompletable,
			IsReplyable:   taskSourceResult.Details.IsReplyable,
		},
		Deeplink:       t.Deeplink,
		Title:          t.Title,
		Body:           t.Body,
		TimeAllocation: t.TimeAllocation,
		Sender:         t.Sender,
		SentAt:         t.CreatedAtExternal.Time().Format(time.RFC3339),
		DueDate:        dueDate,
		IsDone:         t.IsCompleted,
	}
}
