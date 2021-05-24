package api

import (
	"context"
	"log"
	"sort"
	"time"

	"github.com/GeneralTask/task-manager/backend/utils"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func (api *API) TasksList(c *gin.Context) {
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()
	externalAPITokenCollection := db.Collection("external_api_tokens")
	userID, _ := c.Get("user")
	var userObject database.User
	userCollection := db.Collection("users")
	err = userCollection.FindOne(context.TODO(), bson.D{{Key: "_id", Value: userID}}).Decode(&userObject)

	if err != nil {
		log.Printf("Failed to find user")
		Handle500(c)
		return
	}

	currentTasks, err := database.GetActiveTasks(db, userID.(primitive.ObjectID))
	if err != nil {
		Handle500(c)
		return
	}

	var tokens []database.ExternalAPIToken
	cursor, err := externalAPITokenCollection.Find(
		context.TODO(),
		bson.M{"user_id": userID},
	)
	if err != nil {
		log.Printf("Failed to fetch api tokens: %v", err)
		Handle500(c)
		return
	}
	err = cursor.All(context.TODO(), &tokens)
	if err != nil {
		log.Printf("Failed to iterate through api tokens: %v", err)
		Handle500(c)
		return
	}

	calendarEventChannels := []chan CalendarResult{}
	emailChannels := []chan EmailResult{}
	jiraTaskChannels := []chan TaskResult{}
	// Loop through linked accounts and fetch relevant items
	for _, token := range tokens {
		if token.Source == "google" {
			client := getGoogleHttpClient(externalAPITokenCollection, userID.(primitive.ObjectID), token.AccountID)
			if client == nil {
				log.Printf("Failed to fetch google API token: %v", err)
				Handle500(c)
				return
			}
			var calendarEvents = make(chan CalendarResult)
			go LoadCalendarEvents(api, userID.(primitive.ObjectID), token.AccountID, client, calendarEvents)
			calendarEventChannels = append(calendarEventChannels, calendarEvents)

			var emails = make(chan EmailResult)
			go loadEmails(userID.(primitive.ObjectID), token.AccountID, client, emails)
			emailChannels = append(emailChannels, emails)
		} else if token.Source == database.TaskSourceJIRA.Name {
			var JIRATasks = make(chan TaskResult)
			go LoadJIRATasks(api, userID.(primitive.ObjectID), token.AccountID, JIRATasks)
			jiraTaskChannels = append(jiraTaskChannels, JIRATasks)
		}
	}

	calendarEvents := []*database.CalendarEvent{}
	for _, calendarEventChannel := range calendarEventChannels {
		calendarResult := <-calendarEventChannel
		if calendarResult.Error != nil {
			Handle500(c)
			return
		}
		calendarEvents = append(calendarEvents, calendarResult.CalendarEvents...)
	}

	emails := []*database.Email{}
	for _, emailChannel := range emailChannels {
		emailResult := <-emailChannel
		if emailResult.Error != nil {
			Handle500(c)
			return
		}
		emails = append(emails, emailResult.Emails...)
	}

	accountIDToPriorityMapping := make(map[string]*map[string]int)
	jiraTasks := []*database.Task{}
	for _, jiraTaskChannel := range jiraTaskChannels {
		jiraTaskResult := <-jiraTaskChannel
		if jiraTaskResult.Error != nil {
			Handle500(c)
			return
		}
		jiraTasks = append(jiraTasks, jiraTaskResult.Tasks...)
		if len(jiraTaskResult.Tasks) > 0 {
			accountID := jiraTaskResult.Tasks[0].SourceAccountID
			accountIDToPriorityMapping[accountID] = jiraTaskResult.PriorityMapping
		}
	}

	allTasks, err := MergeTasks(
		db,
		currentTasks,
		calendarEvents,
		emails,
		jiraTasks,
		&accountIDToPriorityMapping,
		utils.ExtractEmailDomain(userObject.Email))
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
	JIRATasks []*database.Task,
	taskPriorityMapping *map[string]*map[string]int,
	userDomain string,
) ([]*database.TaskGroup, error) {

	//sort calendar events by start time.
	sort.SliceStable(calendarEvents, func(i, j int) bool {
		return calendarEvents[i].DatetimeStart.Time().Before(calendarEvents[j].DatetimeStart.Time())
	})

	var allUnscheduledTasks []interface{}
	for _, e := range emails {
		allUnscheduledTasks = append(allUnscheduledTasks, e)
	}

	for _, t := range JIRATasks {
		allUnscheduledTasks = append(allUnscheduledTasks, t)
	}

	err := adjustForCompletedTasks(db, currentTasks, &allUnscheduledTasks, &calendarEvents)
	if err != nil {
		return []*database.TaskGroup{}, err
	}

	//first we sort the emails and tasks into a single array
	sort.SliceStable(allUnscheduledTasks, func(i, j int) bool {
		a := allUnscheduledTasks[i]
		b := allUnscheduledTasks[j]

		switch a.(type) {
		case *database.Task:
			switch b.(type) {
			case *database.Task:
				return compareTasks(a.(*database.Task), b.(*database.Task), taskPriorityMapping)
			case *database.Email:
				return compareTaskEmail(a.(*database.Task), b.(*database.Email))
			}
		case *database.Email:
			switch b.(type) {
			case *database.Task:
				return !compareTaskEmail(b.(*database.Task), a.(*database.Email))
			case *database.Email:
				return compareEmails(a.(*database.Email), b.(*database.Email))
			}
		}
		return true
	})

	//we then fill in the gaps with calendar events with these tasks

	var tasks []*TaskItem

	lastEndTime := time.Now()
	taskIndex := 0
	calendarIndex := 0

	for ; calendarIndex < len(calendarEvents); calendarIndex++ {
		calendarEvent := calendarEvents[calendarIndex]

		if taskIndex >= len(allUnscheduledTasks) {
			break
		}

		remainingTime := calendarEvent.DatetimeStart.Time().Sub(lastEndTime)

		taskBase := getTaskBase(allUnscheduledTasks[taskIndex])
		timeAllocation := taskBase.TimeAllocation
		for remainingTime.Nanoseconds() >= timeAllocation {
			tasks = append(tasks, &TaskItem{TaskGroupType: database.UnscheduledGroup, TaskBase: taskBase})
			remainingTime -= time.Duration(timeAllocation)
			taskIndex += 1
			if taskIndex >= len(allUnscheduledTasks) {
				break
			}
			taskBase = getTaskBase(allUnscheduledTasks[taskIndex])
			timeAllocation = taskBase.TimeAllocation
		}

		tasks = append(tasks, &TaskItem{
			TaskGroupType: database.ScheduledTask,
			TaskBase:      &calendarEvent.TaskBase,
			DatetimeEnd:   calendarEvent.DatetimeEnd,
			DatetimeStart: calendarEvent.DatetimeStart,
		})

		lastEndTime = calendarEvent.DatetimeEnd.Time()
	}

	//add remaining calendar events, if they exist.
	for ; calendarIndex < len(calendarEvents); calendarIndex++ {
		calendarEvent := calendarEvents[calendarIndex]
		tasks = append(tasks, &TaskItem{
			TaskGroupType: database.ScheduledTask,
			TaskBase:      &calendarEvent.TaskBase,
			DatetimeEnd:   calendarEvent.DatetimeEnd,
			DatetimeStart: calendarEvent.DatetimeStart,
		})
		lastEndTime = calendarEvent.DatetimeEnd.Time()
	}

	//add remaining non scheduled events, if they exist.
	for ; taskIndex < len(allUnscheduledTasks); taskIndex++ {
		task := getTaskBase(allUnscheduledTasks[taskIndex])
		tasks = append(tasks, &TaskItem{TaskGroupType: database.UnscheduledGroup, TaskBase: task})
	}

	tasks = adjustForReorderedTasks(&tasks)
	err = updateOrderingIDs(db, &tasks)
	if err != nil {
		return []*database.TaskGroup{}, err
	}

	return convertTasksToTaskGroups(&tasks), nil
}

func adjustForCompletedTasks(
	db *mongo.Database,
	currentTasks *[]database.TaskBase,
	unscheduledTasks *[]interface{},
	calendarEvents *[]*database.CalendarEvent,
) error {
	tasksCollection := db.Collection("tasks")
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
			res, err := tasksCollection.UpdateOne(
				context.TODO(),
				bson.M{"_id": currentTask.ID},
				bson.D{{Key: "$set", Value: bson.D{{Key: "is_completed", Value: true}}}},
			)
			if err != nil {
				log.Printf("Failed to update task ordering ID: %v", err)
				return err
			}
			if res.ModifiedCount != 1 {
				log.Printf("Did not find task to update (ID=%v)", currentTask.ID)
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

type TaskItem struct {
	TaskGroupType database.TaskGroupType
	TaskBase      *database.TaskBase
	DatetimeEnd   primitive.DateTime
	DatetimeStart primitive.DateTime
}

type CalendarItem struct {
	IDOrdering int
	TaskIndex  int
}

func adjustForReorderedTasks(tasks *[]*TaskItem) []*TaskItem {
	// for each reordered task, ensure it is in the correct ordering position relative to calendar events
	taskGroupToPreviousCalendarItems := make(map[int][]CalendarItem)
	taskGroupToNextCalendarItems := make(map[int][]CalendarItem)
	currentPreviousCalendarItems := []CalendarItem{}
	for index, taskItem := range *tasks {
		if taskItem.TaskGroupType == database.ScheduledTask {
			if taskItem.TaskBase.IDOrdering == 0 {
				continue
			}
			calendarItem := CalendarItem{IDOrdering: taskItem.TaskBase.IDOrdering, TaskIndex: index}
			currentPreviousCalendarItems = append(currentPreviousCalendarItems, calendarItem)
			for previousIndex, _ := range *tasks {
				if previousIndex >= index {
					break
				}
				taskGroupToNextCalendarItems[previousIndex] = append(
					taskGroupToNextCalendarItems[previousIndex],
					calendarItem,
				)
			}
		}
		if taskItem.TaskGroupType == database.UnscheduledGroup {
			taskGroupToPreviousCalendarItems[index] = currentPreviousCalendarItems
		}
	}
	newTaskList := []*TaskItem{}
	insertAfter := make(map[primitive.ObjectID][]*TaskItem)
	for index, taskItem := range *tasks {
		if taskItem.TaskGroupType == database.ScheduledTask {
			newTaskList = append(append(newTaskList, taskItem), insertAfter[taskItem.TaskBase.ID]...)
			continue
		}
		task := taskItem.TaskBase
		if !task.HasBeenReordered {
			newTaskList = append(newTaskList, taskItem)
			continue
		}
		// check if there is a previous calendar event with a higher ordering id
		previousCalendarItems := taskGroupToPreviousCalendarItems[index]
		var highestItemWithHigherOrderingID *CalendarItem
		for _, previousCalendarItem := range previousCalendarItems {
			orderingID := previousCalendarItem.IDOrdering
			if orderingID > task.IDOrdering &&
				(highestItemWithHigherOrderingID == nil ||
					highestItemWithHigherOrderingID.IDOrdering < orderingID) {
				highestItemWithHigherOrderingID = &previousCalendarItem
			}
		}
		if highestItemWithHigherOrderingID != nil {
			calEventID := (*tasks)[highestItemWithHigherOrderingID.TaskIndex].TaskBase.ID
			for targetIndex, targetItem := range newTaskList {
				if targetItem.TaskBase.ID == calEventID {
					newTaskList = append(newTaskList[:targetIndex+1], newTaskList[targetIndex:]...)
					newTaskList[targetIndex] = taskItem
					break
				}
			}
			continue
		}

		// check if there is an upcoming calendar event with a lower ordering id
		nextCalendarItems := taskGroupToNextCalendarItems[index]
		var lowestItemWithLowerOrderingID *CalendarItem
		for _, nextCalendarItem := range nextCalendarItems {
			orderingID := nextCalendarItem.IDOrdering
			if orderingID < task.IDOrdering &&
				(lowestItemWithLowerOrderingID == nil ||
					lowestItemWithLowerOrderingID.IDOrdering > orderingID) {
				lowestItemWithLowerOrderingID = &nextCalendarItem
			}
		}
		if lowestItemWithLowerOrderingID != nil {
			calEventID := (*tasks)[lowestItemWithLowerOrderingID.TaskIndex].TaskBase.ID
			insertAfter[calEventID] = append(insertAfter[calEventID], taskItem)
			continue
		}
		newTaskList = append(newTaskList, taskItem)
	}
	return newTaskList
}

func updateOrderingIDs(db *mongo.Database, tasks *[]*TaskItem) error {
	tasksCollection := db.Collection("tasks")
	orderingID := 1
	for _, taskItem := range *tasks {
		task := taskItem.TaskBase
		task.IDOrdering = orderingID
		orderingID += 1
		res, err := tasksCollection.UpdateOne(
			context.TODO(),
			bson.M{"_id": task.ID},
			bson.D{{Key: "$set", Value: bson.D{{Key: "id_ordering", Value: task.IDOrdering}}}},
		)
		if err != nil {
			log.Printf("Failed to update task ordering ID: %v", err)
			return err
		}
		if res.ModifiedCount != 1 {
			log.Printf("Did not find task to update (ID=%v)", task.ID)
		}
	}
	return nil
}

func convertTasksToTaskGroups(tasks *[]*TaskItem) []*database.TaskGroup {
	taskGroups := []*database.TaskGroup{}
	lastEndTime := time.Now()
	unscheduledTasks := []*database.TaskBase{}
	for _, taskItem := range *tasks {
		if taskItem.TaskGroupType == database.ScheduledTask {
			if len(unscheduledTasks) > 0 {
				taskGroups = append(taskGroups, &database.TaskGroup{
					TaskGroupType: database.UnscheduledGroup,
					StartTime:     lastEndTime.String(),
					Duration:      int64(taskItem.DatetimeStart.Time().Sub(lastEndTime).Seconds()),
					Tasks:         unscheduledTasks,
				})
				unscheduledTasks = []*database.TaskBase{}
			}
			taskGroups = append(taskGroups, &database.TaskGroup{
				TaskGroupType: database.ScheduledTask,
				StartTime:     taskItem.DatetimeStart.Time().String(),
				Duration:      int64(taskItem.DatetimeEnd.Time().Sub(taskItem.DatetimeStart.Time()).Seconds()),
				Tasks:         []*database.TaskBase{taskItem.TaskBase},
			})
			lastEndTime = taskItem.DatetimeEnd.Time()
		} else {
			unscheduledTasks = append(unscheduledTasks, taskItem.TaskBase)
		}
	}
	if len(unscheduledTasks) > 0 {
		var totalDuration int64
		for _, task := range unscheduledTasks {
			totalDuration += task.TimeAllocation
		}
		taskGroups = append(taskGroups, &database.TaskGroup{
			TaskGroupType: database.UnscheduledGroup,
			StartTime:     lastEndTime.String(),
			Duration:      totalDuration / int64(time.Second),
			Tasks:         unscheduledTasks,
		})
	}
	return taskGroups
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

func compareEmails(e1 *database.Email, e2 *database.Email) bool {
	e1Domain := utils.ExtractEmailDomain(e1.SourceAccountID)
	e2Domain := utils.ExtractEmailDomain(e2.SourceAccountID)
	if res := compareTaskBases(e1, e2); res != nil {
		return *res
	} else if e1.SenderDomain == e1Domain && e2.SenderDomain != e2Domain {
		return true
	} else if e1.SenderDomain != e1Domain && e2.SenderDomain == e2Domain {
		return false
	} else {
		return e1.TimeSent < e2.TimeSent
	}
}

func compareTasks(t1 *database.Task, t2 *database.Task, priorityMapping *map[string]*map[string]int) bool {
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
			return (*(*priorityMapping)[t1.SourceAccountID])[t1.PriorityID] < (*(*priorityMapping)[t2.SourceAccountID])[t2.PriorityID]
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
	var result bool
	if tb1.IDOrdering > 0 && tb2.IDOrdering > 0 {
		result = tb1.IDOrdering < tb2.IDOrdering
	} else if tb1.HasBeenReordered && !tb2.HasBeenReordered {
		result = true
	} else if !tb1.HasBeenReordered && tb2.HasBeenReordered {
		result = false
	} else {
		return nil
	}
	return &result
}
