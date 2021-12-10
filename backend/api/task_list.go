package api

import (
	"context"
	"log"
	"sort"
	"strconv"
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

type TaskItem struct {
	TaskGroupType TaskGroupType
	TaskBase      *database.TaskBase
	DatetimeEnd   primitive.DateTime
	DatetimeStart primitive.DateTime
}

type TaskSource struct {
	Name          string `json:"name"`
	Logo          string `json:"logo"`
	IsCompletable bool   `json:"is_completable"`
	IsReplyable   bool   `json:"is_replyable"`
}

type ConferenceCall struct {
	Platform string `json:"platform"`
	Logo     string `json:"logo"`
	URL      string `json:"url"`
}

type TaskResult struct {
	ID             primitive.ObjectID `json:"id"`
	IDOrdering     int                `json:"id_ordering"`
	Sender         string             `json:"sender"`
	Source         TaskSource         `json:"source"`
	Deeplink       string             `json:"deeplink"`
	Title          string             `json:"title"`
	Body           string             `json:"body"`
	TimeAllocation int64              `json:"time_allocated"`
	ConferenceCall *ConferenceCall    `json:"conference_call"`
	SentAt         string             `json:"sent_at"`
}

type CalendarItem struct {
	IDOrdering int
	TaskIndex  int
}

type TaskGroup struct {
	TaskGroupType `json:"type"`
	StartTime     string        `json:"datetime_start"`
	Duration      int64         `json:"time_duration"`
	Tasks         []*TaskResult `json:"tasks"`
}

type TaskSection struct {
	ID         primitive.ObjectID `json:"id"`
	Name       string             `json:"name"`
	IsToday    bool               `json:"is_today"`
	TaskGroups []*TaskGroup       `json:"task_groups"`
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

	calendarEventChannels := []chan external.CalendarResult{}
	emailChannels := []chan external.EmailResult{}
	taskChannels := []chan external.TaskResult{}
	timezoneOffset, err := strconv.ParseInt(c.GetHeader("Timezone-Offset"), 10, 64)
	if err != nil {
		c.JSON(400, gin.H{"detail": "Invalid timezone offset"})
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
			var calendarEvents = make(chan external.CalendarResult)
			go taskSource.GetEvents(userID.(primitive.ObjectID), token.AccountID, int(timezoneOffset), calendarEvents)
			calendarEventChannels = append(calendarEventChannels, calendarEvents)

			var emails = make(chan external.EmailResult)
			go taskSource.GetEmails(userID.(primitive.ObjectID), token.AccountID, emails)
			emailChannels = append(emailChannels, emails)

			var tasks = make(chan external.TaskResult)
			go taskSource.GetTasks(userID.(primitive.ObjectID), token.AccountID, tasks)
			taskChannels = append(taskChannels, tasks)
		}
	}

	calendarEvents := []*database.CalendarEvent{}
	for _, calendarEventChannel := range calendarEventChannels {
		calendarResult := <-calendarEventChannel
		if calendarResult.Error != nil {
			continue
		}
		calendarEvents = append(calendarEvents, calendarResult.CalendarEvents...)
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

	allTasks, err := MergeTasks(
		db,
		currentTasks,
		calendarEvents,
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

func MergeTasks(
	db *mongo.Database,
	currentTasks *[]database.TaskBase,
	calendarEvents []*database.CalendarEvent,
	emails []*database.Email,
	tasks []*database.Task,
	userID primitive.ObjectID,
) ([]*TaskSection, error) {

	//sort calendar events by start time.
	sort.SliceStable(calendarEvents, func(i, j int) bool {
		return calendarEvents[i].DatetimeStart.Time().Before(calendarEvents[j].DatetimeStart.Time())
	})

	var allUnscheduledTasks []interface{}
	for _, e := range emails {
		allUnscheduledTasks = append(allUnscheduledTasks, e)
	}

	for _, t := range tasks {
		allUnscheduledTasks = append(allUnscheduledTasks, t)
	}

	err := adjustForCompletedTasks(db, currentTasks, &allUnscheduledTasks, &calendarEvents)
	if err != nil {
		return []*TaskSection{}, err
	}

	blockedTasks, backlogTasks, allUnscheduledTasks := extractSectionTasks(&allUnscheduledTasks)

	// sort blocked tasks by ordering ID
	// we can assume every task has a proper ordering ID because tasks have to be dragged into the blocked section
	sort.SliceStable(blockedTasks, func(i, j int) bool {
		a := blockedTasks[i]
		b := blockedTasks[j]
		return a.TaskBase.IDOrdering < b.TaskBase.IDOrdering
	})

	// sort backlog tasks by ordering ID
	// we can assume every task has a proper ordering ID because tasks have to be dragged into the backlog section
	sort.SliceStable(backlogTasks, func(i, j int) bool {
		a := backlogTasks[i]
		b := backlogTasks[j]
		return a.TaskBase.IDOrdering < b.TaskBase.IDOrdering
	})

	orderingSetting, err := settings.GetUserSetting(db, userID, settings.SettingFieldEmailOrderingPreference)
	if err != nil {
		log.Printf("failed to fetch email ordering setting: %v", err)
		return []*TaskSection{}, err
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

	var taskItems []*TaskItem

	lastEndTime := time.Now()
	calendarIndex := 0

	for ; calendarIndex < len(calendarEvents); calendarIndex++ {
		calendarEvent := calendarEvents[calendarIndex]

		if len(allUnscheduledTasks) == 0 {
			break
		}

		remainingTime := calendarEvent.DatetimeStart.Time().Sub(lastEndTime)

		var newUnscheduledTasks []interface{}
		for _, unscheduledTask := range allUnscheduledTasks {
			taskBase := getTaskBase(unscheduledTask)
			if taskBase.TimeAllocation > remainingTime.Nanoseconds() {
				// we won't use this unscheduled task in this group, so add it to the remaining unscheduled tasks group
				newUnscheduledTasks = append(newUnscheduledTasks, unscheduledTask)
				continue
			}
			taskItems = append(taskItems, &TaskItem{TaskGroupType: UnscheduledGroup, TaskBase: taskBase})
			remainingTime -= time.Duration(taskBase.TimeAllocation)
		}
		allUnscheduledTasks = newUnscheduledTasks

		taskItems = append(taskItems, &TaskItem{
			TaskGroupType: ScheduledTask,
			TaskBase:      &calendarEvent.TaskBase,
			DatetimeEnd:   calendarEvent.DatetimeEnd,
			DatetimeStart: calendarEvent.DatetimeStart,
		})

		endTime := calendarEvent.DatetimeEnd.Time()
		if endTime.After(lastEndTime) {
			// ensures we properly handle overlapping events
			lastEndTime = endTime
		}
	}

	//add remaining calendar events, if they exist.
	for ; calendarIndex < len(calendarEvents); calendarIndex++ {
		calendarEvent := calendarEvents[calendarIndex]
		taskItems = append(taskItems, &TaskItem{
			TaskGroupType: ScheduledTask,
			TaskBase:      &calendarEvent.TaskBase,
			DatetimeEnd:   calendarEvent.DatetimeEnd,
			DatetimeStart: calendarEvent.DatetimeStart,
		})
		lastEndTime = calendarEvent.DatetimeEnd.Time()
	}

	//add remaining non scheduled events, if they exist.
	for _, unscheduledTask := range allUnscheduledTasks {
		task := getTaskBase(unscheduledTask)
		taskItems = append(taskItems, &TaskItem{TaskGroupType: UnscheduledGroup, TaskBase: task})
	}

	err = updateOrderingIDs(db, &taskItems)
	if err != nil {
		return []*TaskSection{}, err
	}

	err = updateOrderingIDs(db, &blockedTasks)
	if err != nil {
		return []*TaskSection{}, err
	}

	err = updateOrderingIDs(db, &backlogTasks)
	if err != nil {
		return []*TaskSection{}, err
	}

	return []*TaskSection{
		{
			ID:         constants.IDTaskSectionToday,
			Name:       TaskSectionNameToday,
			IsToday:    true,
			TaskGroups: convertTasksToTaskGroups(&taskItems),
		},
		{
			ID:         constants.IDTaskSectionBlocked,
			Name:       TaskSectionNameBlocked,
			IsToday:    false,
			TaskGroups: convertTasksToTaskGroups(&blockedTasks),
		},
		{
			ID:         constants.IDTaskSectionBacklog,
			Name:       TaskSectionNameBacklog,
			IsToday:    false,
			TaskGroups: convertTasksToTaskGroups(&backlogTasks),
		},
	}, nil
}

func extractSectionTasks(allUnscheduledTasks *[]interface{}) ([]*TaskItem, []*TaskItem, []interface{}) {
	var blockedTasks []*TaskItem
	var backlogTasks []*TaskItem
	var allOtherTasks []interface{}
	for _, task := range *allUnscheduledTasks {
		switch task := task.(type) {
		case *database.Email:
			if task.IDTaskSection == constants.IDTaskSectionBlocked {
				blockedTasks = append(blockedTasks, &TaskItem{
					TaskGroupType: UnscheduledGroup,
					TaskBase:      &task.TaskBase,
				})
				continue
			}
			if task.IDTaskSection == constants.IDTaskSectionBacklog {
				backlogTasks = append(backlogTasks, &TaskItem{
					TaskGroupType: UnscheduledGroup,
					TaskBase:      &task.TaskBase,
				})
				continue
			}
		case *database.Task:
			if task.IDTaskSection == constants.IDTaskSectionBlocked {
				blockedTasks = append(blockedTasks, &TaskItem{
					TaskGroupType: UnscheduledGroup,
					TaskBase:      &task.TaskBase,
				})
				continue
			}
			if task.IDTaskSection == constants.IDTaskSectionBacklog {
				backlogTasks = append(backlogTasks, &TaskItem{
					TaskGroupType: UnscheduledGroup,
					TaskBase:      &task.TaskBase,
				})
				continue
			}
		}
		allOtherTasks = append(allOtherTasks, task)
	}
	return blockedTasks, backlogTasks, allOtherTasks
}

func adjustForCompletedTasks(
	db *mongo.Database,
	currentTasks *[]database.TaskBase,
	unscheduledTasks *[]interface{},
	calendarEvents *[]*database.CalendarEvent,
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
	for _, calendarEvent := range *calendarEvents {
		newTasks = append(newTasks, &calendarEvent.TaskBase)
		newTaskIDs[calendarEvent.ID] = true
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

func updateOrderingIDs(db *mongo.Database, tasks *[]*TaskItem) error {
	parentCtx := context.Background()
	tasksCollection := database.GetTaskCollection(db)
	orderingID := 1
	for _, taskItem := range *tasks {
		task := taskItem.TaskBase
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

func convertTasksToTaskGroups(tasks *[]*TaskItem) []*TaskGroup {
	taskGroups := []*TaskGroup{}
	lastEndTime := time.Now()
	unscheduledTasks := []*TaskResult{}
	for index, taskItem := range *tasks {
		if taskItem.TaskGroupType == ScheduledTask {
			if len(unscheduledTasks) > 0 || index == 0 {
				taskGroups = append(taskGroups, &TaskGroup{
					TaskGroupType: UnscheduledGroup,
					StartTime:     lastEndTime.Format(time.RFC3339),
					Duration:      int64(taskItem.DatetimeStart.Time().Sub(lastEndTime).Seconds()),
					Tasks:         unscheduledTasks,
				})
				unscheduledTasks = []*TaskResult{}
			}
			taskGroups = append(taskGroups, &TaskGroup{
				TaskGroupType: ScheduledTask,
				StartTime:     taskItem.DatetimeStart.Time().Format(time.RFC3339),
				Duration:      int64(taskItem.DatetimeEnd.Time().Sub(taskItem.DatetimeStart.Time()).Seconds()),
				Tasks:         []*TaskResult{taskBaseToTaskResult(taskItem.TaskBase)},
			})
			lastEndTime = taskItem.DatetimeEnd.Time()
		} else {
			unscheduledTasks = append(unscheduledTasks, taskBaseToTaskResult(taskItem.TaskBase))
		}
	}
	var totalDuration int64
	for _, task := range unscheduledTasks {
		totalDuration += task.TimeAllocation
	}
	taskGroups = append(taskGroups, &TaskGroup{
		TaskGroupType: UnscheduledGroup,
		StartTime:     lastEndTime.Format(time.RFC3339),
		Duration:      totalDuration / int64(time.Second),
		Tasks:         unscheduledTasks,
	})
	return taskGroups
}

func taskBaseToTaskResult(t *database.TaskBase) *TaskResult {
	// Normally we need to use api.ExternalConfig but we are just using the source details constants here
	taskSourceResult, _ := external.GetConfig().GetTaskSourceResult(t.SourceID)
	return &TaskResult{
		ID:         t.ID,
		IDOrdering: t.IDOrdering,
		Sender:     t.Sender,
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
		ConferenceCall: (*ConferenceCall)(t.ConferenceCall),
		SentAt:         t.CreatedAtExternal.Time().Format(time.RFC3339),
	}
}

func getTaskBase(t interface{}) *database.TaskBase {
	switch t := t.(type) {
	case *database.Email:
		return &(t.TaskBase)
	case *database.Task:
		return &(t.TaskBase)
	case *database.CalendarEvent:
		return &(t.TaskBase)
	default:
		return nil
	}
}

func compareEmails(e1 *database.Email, e2 *database.Email, newestEmailsFirst bool) bool {
	e1Domain := utils.ExtractEmailDomain(e1.SourceAccountID)
	e2Domain := utils.ExtractEmailDomain(e2.SourceAccountID)
	if res := compareTaskBases(e1, e2); res != nil {
		return *res
	} else if e1.SenderDomain == e1Domain && e2.SenderDomain != e2Domain {
		return true
	} else if e1.SenderDomain != e1Domain && e2.SenderDomain == e2Domain {
		return false
	} else if newestEmailsFirst {
		return e1.TaskBase.CreatedAtExternal > e2.TaskBase.CreatedAtExternal
	} else {
		return e1.TaskBase.CreatedAtExternal < e2.TaskBase.CreatedAtExternal
	}
}

func compareTasks(t1 *database.Task, t2 *database.Task) bool {
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

func compareTaskEmail(t *database.Task, e *database.Email) bool {
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
