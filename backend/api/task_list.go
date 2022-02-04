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
}

type TaskSection struct {
	ID    primitive.ObjectID `json:"id"`
	Name  string             `json:"name"`
	Tasks []*TaskResult      `json:"tasks"`
}

type TaskGroupType string

const (
	ScheduledTask          TaskGroupType = "scheduled_task"
	UnscheduledGroup       TaskGroupType = "unscheduled_group"
	TaskSectionNameToday   string        = "Today"
	TaskSectionNameBlocked string        = "Blocked"
	TaskSectionNameBacklog string        = "Backlog"
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
		for _, taskBase := range *currentTasks {
			task := database.Item{TaskBase: taskBase}
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

	allTasks, err := MergeTasks(
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

func MergeTasks(
	db *mongo.Database,
	currentTasks *[]database.TaskBase,
	fetchedTasks *[]*database.Item,
	userID primitive.ObjectID,
) ([]*TaskSection, error) {
	err := adjustForCompletedTasks(db, currentTasks, fetchedTasks)
	if err != nil {
		return []*TaskSection{}, err
	}

	sort.SliceStable(fetchedTasks, func(i, j int) bool {
		a := (*fetchedTasks)[i]
		b := (*fetchedTasks)[j]
		return a.IDOrdering < b.IDOrdering
	})

	blockedTasks, backlogTasks, todayTasks := extractSectionTasksV2(fetchedTasks)

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
	}, nil
}

func extractSectionTasksV2(fetchedTasks *[]*database.Item) ([]*TaskResult, []*TaskResult, []*TaskResult) {
	blockedTasks := make([]*TaskResult, 0)
	backlogTasks := make([]*TaskResult, 0)
	allOtherTasks := make([]*TaskResult, 0)
	for _, task := range *fetchedTasks {
		if task.IDTaskSection == constants.IDTaskSectionBlocked {
			blockedTasks = append(blockedTasks, taskBaseToTaskResult(&task.TaskBase))
			continue
		}
		if task.IDTaskSection == constants.IDTaskSectionBacklog {
			backlogTasks = append(backlogTasks, taskBaseToTaskResult(&task.TaskBase))
			continue
		}
		allOtherTasks = append(allOtherTasks, taskBaseToTaskResult(&task.TaskBase))
	}
	return blockedTasks, backlogTasks, allOtherTasks
}

func adjustForCompletedTasks(
	db *mongo.Database,
	currentTasks *[]database.TaskBase,
	fetchedTasks *[]*database.Item,
) error {
	// decrements IDOrdering for tasks behind newly completed tasks
	parentCtx := context.Background()
	tasksCollection := database.GetTaskCollection(db)
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
			dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
			defer cancel()
			res, err := tasksCollection.UpdateOne(
				dbCtx,
				bson.M{"_id": currentTask.ID},
				bson.M{"$set": bson.M{"is_completed": true}},
			)
			if err != nil {
				log.Printf("failed to update task ordering ID: %v", err)
				return err
			}
			if res.MatchedCount != 1 {
				log.Printf("did not find task to mark completed (ID=%v)", currentTask.ID)
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

func taskBaseToTaskResult(t *database.TaskBase) *TaskResult {
	// Normally we need to use api.ExternalConfig but we are just using the source details constants here
	taskSourceResult, _ := external.GetConfig().GetTaskSourceResult(t.SourceID)
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
	}
}
