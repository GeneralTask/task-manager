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

type TaskSource struct {
	Name          string `json:"name"`
	Logo          string `json:"logo"`
	IsCompletable bool   `json:"is_completable"`
	IsReplyable   bool   `json:"is_replyable"`
}

type TaskResult struct {
	ID             primitive.ObjectID `json:"id"`
	IDOrdering     int                `json:"id_ordering"`
	Source         TaskSource         `json:"source"`
	Deeplink       string             `json:"deeplink"`
	Title          string             `json:"title"`
	Body           string             `json:"body"`
	Sender         string             `json:"sender"`
	DueDate        string             `json:"due_date"`
	TimeAllocation int64              `json:"time_allocated"`
	SentAt         string             `json:"sent_at"`
	IsDone         bool               `json:"is_done"`
}

type TaskSection struct {
	ID     primitive.ObjectID `json:"id"`
	Name   string             `json:"name"`
	Tasks  []*TaskResult      `json:"tasks"`
	IsDone bool               `json:"is_done"`
}

type TaskGroupType string

const (
	ScheduledTask          TaskGroupType = "scheduled_task"
	UnscheduledGroup       TaskGroupType = "unscheduled_group"
	TaskSectionNameToday   string        = "Today"
	TaskSectionNameBlocked string        = "Blocked"
	TaskSectionNameBacklog string        = "Backlog"
	TaskSectionNameDone    string        = "Done"
)

func (api *API) TasksList(c *gin.Context) {
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
	cutoff := primitive.NewDateTimeFromTime(time.Now().Add(-55 * time.Second))
	fastRefresh := userObject.LastRefreshed > cutoff

	currentTasks, err := database.GetActiveTasks(db, userID.(primitive.ObjectID))
	if err != nil {
		Handle500(c)
		return
	}

	var fetchedTasks *[]*database.Item
	if fastRefresh {
		// this is a temporary hack to trick MergeTasks into thinking we fetched these tasks
		fakeFetchedTasks := []*database.Item{}
		for _, item := range *currentTasks {
			task := database.Item{TaskBase: item.TaskBase}
			fakeFetchedTasks = append(fakeFetchedTasks, &task)
		}
		fetchedTasks = &fakeFetchedTasks
	} else {
		fetchedTasks, err = api.fetchTasks(parentCtx, db, userID)
		if err != nil {
			Handle500(c)
			return
		}
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		_, err = userCollection.UpdateOne(
			dbCtx,
			bson.M{"_id": userID},
			bson.M{"$set": bson.M{"last_refreshed": primitive.NewDateTimeFromTime(time.Now())}},
		)
		if err != nil {
			log.Printf("failed to update user last_refreshed: %v", err)
		}
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

func (api *API) fetchTasks(parentCtx context.Context, db *mongo.Database, userID interface{}) (*[]*database.Item, error) {
	var tokens []database.ExternalAPIToken
	externalAPITokenCollection := database.GetExternalTokenCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	cursor, err := externalAPITokenCollection.Find(
		dbCtx,
		bson.M{"user_id": userID},
	)
	if err != nil {
		log.Printf("failed to fetch api tokens: %v", err)
		return nil, err
	}
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = cursor.All(dbCtx, &tokens)
	if err != nil {
		log.Printf("failed to iterate through api tokens: %v", err)
		return nil, err
	}
	// add dummy token for gt_task fetch logic
	tokens = append(tokens, database.ExternalAPIToken{
		AccountID: external.GeneralTaskDefaultAccountID,
		ServiceID: external.TASK_SERVICE_ID_GT,
	})

	taskChannels := []chan external.TaskResult{}
	// Loop through linked accounts and fetch relevant items
	for _, token := range tokens {
		taskServiceResult, err := api.ExternalConfig.GetTaskServiceResult(token.ServiceID)
		if err != nil {
			log.Printf("error loading task service: %v", err)
			continue
		}
		for _, taskSource := range taskServiceResult.Sources {
			var tasks = make(chan external.TaskResult)
			go taskSource.GetTasks(userID.(primitive.ObjectID), token.AccountID, tasks)
			taskChannels = append(taskChannels, tasks)
		}
	}

	tasks := []*database.Item{}
	for _, taskChannel := range taskChannels {
		taskResult := <-taskChannel
		if taskResult.Error != nil {
			continue
		}
		tasks = append(tasks, taskResult.Tasks...)
	}
	return &tasks, nil
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

	sections, err := api.extractSectionTasksV2(db, userID, fetchedTasks)
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

func (api *API) extractSectionTasksV2(
	db *mongo.Database,
	userID primitive.ObjectID,
	fetchedTasks *[]*database.Item,
) ([]*TaskSection, error) {
	userSections, err := database.GetTaskSections(db, userID)
	if err != nil {
		log.Printf("failed to fetch task sections: %+v", err)
		return []*TaskSection{}, err
	}
	resultSections := []*TaskSection{
		{
			ID:    constants.IDTaskSectionToday,
			Name:  TaskSectionNameToday,
			Tasks: []*TaskResult{},
		},
		{
			ID:    constants.IDTaskSectionBlocked,
			Name:  TaskSectionNameBlocked,
			Tasks: []*TaskResult{},
		},
		{
			ID:    constants.IDTaskSectionBacklog,
			Name:  TaskSectionNameBacklog,
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
		taskResult := api.taskBaseToTaskResult(&task.TaskBase)
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
