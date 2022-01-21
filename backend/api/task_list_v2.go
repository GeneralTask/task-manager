package api

import (
	"context"
	"log"
	"sort"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/GeneralTask/task-manager/backend/settings"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

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

func (api *API) TasksListV2(c *gin.Context) {
	parentCtx := c.Request.Context()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}

	defer dbCleanup()
	externalAPITokenCollection := database.GetExternalTokenCollection(db)
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

	var tokens []database.ExternalAPIToken
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	cursor, err := externalAPITokenCollection.Find(
		dbCtx,
		bson.M{"user_id": userID},
	)
	if err != nil {
		log.Printf("failed to fetch api tokens: %v", err)
		Handle500(c)
		return
	}
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = cursor.All(dbCtx, &tokens)
	if err != nil {
		log.Printf("failed to iterate through api tokens: %v", err)
		Handle500(c)
		return
	}
	// add dummy token for gt_task fetch logic
	tokens = append(tokens, database.ExternalAPIToken{
		AccountID: external.GeneralTaskDefaultAccountID,
		ServiceID: external.TASK_SERVICE_ID_GT,
	})

	emailChannels := []chan external.EmailResult{}
	taskChannels := []chan external.TaskResult{}
	if err != nil {
		c.JSON(400, gin.H{"detail": "invalid timezone offset"})
		return
	}
	// Loop through linked accounts and fetch relevant items
	for _, token := range tokens {
		taskServiceResult, err := api.ExternalConfig.GetTaskServiceResult(token.ServiceID)
		if err != nil {
			log.Printf("error loading task service: %v", err)
			continue
		}
		for _, taskSource := range taskServiceResult.Sources {
			var emails = make(chan external.EmailResult)
			go taskSource.GetEmails(userID.(primitive.ObjectID), token.AccountID, emails)
			emailChannels = append(emailChannels, emails)

			var tasks = make(chan external.TaskResult)
			go taskSource.GetTasks(userID.(primitive.ObjectID), token.AccountID, tasks)
			taskChannels = append(taskChannels, tasks)
		}
	}

	emails := []*database.Email{}
	for _, emailChannel := range emailChannels {
		emailResult := <-emailChannel
		if emailResult.Error != nil {
			continue
		}
		emails = append(emails, emailResult.Emails...)
	}

	for index := range emails {
		emails[index].TaskBase.Body = "<base target=\"_blank\">" + emails[index].TaskBase.Body
	}

	tasks := []*database.Task{}
	for _, taskChannel := range taskChannels {
		taskResult := <-taskChannel
		if taskResult.Error != nil {
			continue
		}
		tasks = append(tasks, taskResult.Tasks...)
	}

	allTasks, err := MergeTasksV2(
		db,
		currentTasks,
		emails,
		tasks,
		userID.(primitive.ObjectID),
	)
	if err != nil {
		Handle500(c)
		return
	}
	c.JSON(200, allTasks)
}

func MergeTasksV2(
	db *mongo.Database,
	currentTasks *[]database.TaskBase,
	emails []*database.Email,
	tasks []*database.Task,
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
		a := allUnscheduledTasks[i]
		b := allUnscheduledTasks[j]

		switch a.(type) {
		case *database.Task:
			switch b.(type) {
			case *database.Task:
				return compareTasks(a.(*database.Task), b.(*database.Task))
			case *database.Email:
				return compareTaskEmail(a.(*database.Task), b.(*database.Email))
			}
		case *database.Email:
			switch b.(type) {
			case *database.Task:
				return !compareTaskEmail(b.(*database.Task), a.(*database.Email))
			case *database.Email:
				return compareEmails(a.(*database.Email), b.(*database.Email), newestEmailsFirst)
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
		case *database.Email:
			if task.IDTaskSection == constants.IDTaskSectionBlocked {
				blockedTasks = append(blockedTasks, taskBaseToTaskResultV2(&task.TaskBase))
				continue
			}
			if task.IDTaskSection == constants.IDTaskSectionBacklog {
				backlogTasks = append(backlogTasks, taskBaseToTaskResultV2(&task.TaskBase))
				continue
			}
		case *database.Task:
			if task.IDTaskSection == constants.IDTaskSectionBlocked {
				blockedTasks = append(blockedTasks, taskBaseToTaskResultV2(&task.TaskBase))
				continue
			}
			if task.IDTaskSection == constants.IDTaskSectionBacklog {
				backlogTasks = append(backlogTasks, taskBaseToTaskResultV2(&task.TaskBase))
				continue
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
	log.Println("due date:", dueDate, "due date time:", t.DueDate.Time().Unix(), t.DueDate.Time().IsZero(), t.DueDate)
	log.Println(t.DueDate.Time().Second(), t.DueDate.Time().Nanosecond())
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
