package api

import (
	"context"
	"log"
	"sort"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/GeneralTask/task-manager/backend/settings"
	"github.com/GeneralTask/task-manager/backend/utils"

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

type TaskResultV2 struct {
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

type TaskSectionV2 struct {
	ID    primitive.ObjectID `json:"id"`
	Name  string             `json:"name"`
	Tasks []*TaskResultV2    `json:"tasks"`
}

type TaskGroupType string

const (
	ScheduledTask          TaskGroupType = "scheduled_task"
	UnscheduledGroup       TaskGroupType = "unscheduled_group"
	TaskSectionNameToday   string        = "Today"
	TaskSectionNameBlocked string        = "Blocked"
	TaskSectionNameBacklog string        = "Backlog"
)

func (api *API) TasksListV2(c *gin.Context) {
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
	cutoff := primitive.NewDateTimeFromTime(time.Now().Add(-10 * time.Second))
	fastRefresh := userObject.LastRefreshed > cutoff

	currentTasks, err := database.GetActiveTasks(db, userID.(primitive.ObjectID))
	if err != nil {
		Handle500(c)
		return
	}

	var fetchedTasks *[]*database.Task
	if fastRefresh {
		// this is a temporary hack to trick MergeTasks into thinking we fetched these tasks
		fakeFetchedTasks := []*database.Task{}
		for _, taskBase := range *currentTasks {
			task := database.Task{TaskBase: taskBase}
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

	allTasks, err := MergeTasksV2(
		db,
		currentTasks,
		[]*database.Item{},
		*fetchedTasks,
		userID.(primitive.ObjectID),
	)
	if err != nil {
		Handle500(c)
		return
	}
	c.JSON(200, allTasks)
}

func (api *API) fetchTasks(parentCtx context.Context, db *mongo.Database, userID interface{}) (*[]*database.Task, error) {
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

func MergeTasksV2(
	db *mongo.Database,
	currentTasks *[]database.TaskBase,
	emails []*database.Item,
	tasks []*database.Item,
	userID primitive.ObjectID,
) ([]*TaskSectionV2, error) {
	var allUnscheduledTasks []interface{}
	for _, e := range emails {
		allUnscheduledTasks = append(allUnscheduledTasks, e)
	}

	for _, t := range tasks {
		allUnscheduledTasks = append(allUnscheduledTasks, t)
	}

	err := adjustForCompletedTasksV2(db, currentTasks, &allUnscheduledTasks)
	if err != nil {
		return []*TaskSectionV2{}, err
	}

	blockedTasks, backlogTasks, allUnscheduledTasks := extractSectionTasksV2(&allUnscheduledTasks)

	// sort blocked tasks by ordering ID
	// we can assume every task has a proper ordering ID because tasks have to be dragged into the blocked section
	sort.SliceStable(blockedTasks, func(i, j int) bool {
		a := blockedTasks[i]
		b := blockedTasks[j]
		return a.IDOrdering < b.IDOrdering
	})

	// sort backlog tasks by ordering ID
	// we can assume every task has a proper ordering ID because tasks have to be dragged into the backlog section
	sort.SliceStable(backlogTasks, func(i, j int) bool {
		a := backlogTasks[i]
		b := backlogTasks[j]
		return a.IDOrdering < b.IDOrdering
	})

	orderingSetting, err := settings.GetUserSetting(db, userID, settings.SettingFieldEmailOrderingPreference)
	if err != nil {
		log.Printf("failed to fetch email ordering setting: %v", err)
		return []*TaskSectionV2{}, err
	}
	newestEmailsFirst := *orderingSetting == settings.ChoiceKeyNewestFirst

	//first we sort the emails and tasks into a single array
	sort.SliceStable(allUnscheduledTasks, func(i, j int) bool {
		a := allUnscheduledTasks[i].(*database.Item)
		b := allUnscheduledTasks[j].(*database.Item)

		if a.IsMessage {
			if b.IsMessage {
				return compareEmails(a, b, newestEmailsFirst)
			} else if b.IsTask {
				return !compareTaskEmail(b, a)
			}
		} else if a.IsTask {
			if b.IsMessage {
				return compareTaskEmail(a, b)
			} else if b.IsTask {
				return compareTasks(a, b)
			}
		}
		return true
	})

	//we then fill in the gaps with calendar events with these tasks

	var taskResults []*TaskResultV2

	//add remaining non scheduled events, if they exist.
	for _, unscheduledTask := range allUnscheduledTasks {
		task := getTaskBase(unscheduledTask)
		taskResults = append(taskResults, taskBaseToTaskResultV2(task))
	}

	err = updateOrderingIDsV2(db, &taskResults)
	if err != nil {
		return []*TaskSectionV2{}, err
	}

	err = updateOrderingIDsV2(db, &blockedTasks)
	if err != nil {
		return []*TaskSectionV2{}, err
	}

	err = updateOrderingIDsV2(db, &backlogTasks)
	if err != nil {
		return []*TaskSectionV2{}, err
	}

	return []*TaskSectionV2{
		{
			ID:    constants.IDTaskSectionToday,
			Name:  TaskSectionNameToday,
			Tasks: taskResults,
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

func extractSectionTasksV2(allUnscheduledTasks *[]interface{}) ([]*TaskResultV2, []*TaskResultV2, []interface{}) {
	blockedTasks := make([]*TaskResultV2, 0)
	backlogTasks := make([]*TaskResultV2, 0)
	var allOtherTasks []interface{}
	for _, task := range *allUnscheduledTasks {
		switch task := task.(type) {
		case *database.Item:
			if task.IsMessage || task.IsTask {
				if task.IDTaskSection == constants.IDTaskSectionBlocked {
					blockedTasks = append(blockedTasks, taskBaseToTaskResultV2(&task.TaskBase))
					continue
				}
				if task.IDTaskSection == constants.IDTaskSectionBacklog {
					backlogTasks = append(backlogTasks, taskBaseToTaskResultV2(&task.TaskBase))
					continue
				}
			}
		}
		allOtherTasks = append(allOtherTasks, task)
	}
	return blockedTasks, backlogTasks, allOtherTasks
}

func adjustForCompletedTasksV2(
	db *mongo.Database,
	currentTasks *[]database.TaskBase,
	unscheduledTasks *[]interface{},
) error {
	// decrements IDOrdering for tasks behind newly completed tasks
	parentCtx := context.Background()
	tasksCollection := database.GetTaskCollection(db)
	var newTasks []*database.TaskBase
	newTaskIDs := make(map[primitive.ObjectID]bool)
	for _, unscheduledTask := range *unscheduledTasks {
		taskBase := getTaskBase(unscheduledTask)
		newTasks = append(newTasks, taskBase)
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

func updateOrderingIDsV2(db *mongo.Database, tasks *[]*TaskResultV2) error {
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

func taskBaseToTaskResultV2(t *database.TaskBase) *TaskResultV2 {
	// Normally we need to use api.ExternalConfig but we are just using the source details constants here
	taskSourceResult, _ := external.GetConfig().GetTaskSourceResult(t.SourceID)
	var dueDate string
	if t.DueDate.Time().Unix() == int64(0) {
		dueDate = ""
	} else {
		dueDate = t.DueDate.Time().Format("2006-01-02")
	}
	return &TaskResultV2{
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

func getTaskBase(t interface{}) *database.TaskBase {
	switch t := t.(type) {
	case *database.Item: // todo - using in place of email and task types for now
		return &(t.TaskBase)
	case *database.CalendarEvent:
		return &(t.TaskBase)
	default:
		return nil
	}
}

func compareEmails(e1 *database.Item, e2 *database.Item, newestEmailsFirst bool) bool {
	if newestEmailsFirst {
		return e1.TaskBase.CreatedAtExternal > e2.TaskBase.CreatedAtExternal
	} else {
		return e1.TaskBase.CreatedAtExternal < e2.TaskBase.CreatedAtExternal
	}
}

func compareTasks(t1 *database.Item, t2 *database.Item) bool {
	if res := compareTaskBases(t1, t2); res != nil {
		return *res
	}
	sevenDaysFromNow := time.Now().AddDate(0, 0, 7)
	//if both have due dates before seven days, prioritize the one with the closer due date.
	if t1.DueDate > 0 &&
		t2.DueDate > 0 &&
		t1.DueDate.Time().Before(sevenDaysFromNow) &&
		t2.DueDate.Time().Before(sevenDaysFromNow) {
		return t1.DueDate.Time().Before(t2.DueDate.Time())
	} else if t1.DueDate > 0 && t1.DueDate.Time().Before(sevenDaysFromNow) {
		//t1 is due within seven days, t2 is not so prioritize t1
		return true
	} else if t2.DueDate > 0 && t2.DueDate.Time().Before(sevenDaysFromNow) {
		//t2 is due within seven days, t1 is not so prioritize t2
		return false
	} else if t1.PriorityID != t2.PriorityID {
		if len(t1.PriorityID) > 0 && len(t2.PriorityID) > 0 {
			return t1.PriorityNormalized < t2.PriorityNormalized
		} else if len(t1.PriorityID) > 0 {
			return true
		} else {
			return false
		}
	} else {
		//if all else fails prioritize by task number.
		return t1.TaskNumber < t2.TaskNumber
	}
}

func compareTaskEmail(t *database.Item, e *database.Item) bool {
	if res := compareTaskBases(t, e); res != nil {
		return *res
	}
	return e.SenderDomain != utils.ExtractEmailDomain(e.SourceAccountID)
}

func compareTaskBases(t1 interface{}, t2 interface{}) *bool {
	// ensures we respect the existing ordering ids, and exempts reordered tasks from the normal auto-ordering
	tb1 := getTaskBase(t1)
	tb2 := getTaskBase(t2)
	if tb1.IDOrdering > 0 && tb2.IDOrdering > 0 {
		result := tb1.IDOrdering < tb2.IDOrdering
		return &result
	}
	return nil
}
