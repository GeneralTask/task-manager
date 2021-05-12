package api

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"sort"
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/oauth2"
)

func (api *API) TasksList(c *gin.Context) {
	db, dbCleanup := database.GetDBConnection()
	defer dbCleanup()
	externalAPITokenCollection := db.Collection("external_api_tokens")
	var googleToken database.ExternalAPIToken
	userID, _ := c.Get("user")
	err := externalAPITokenCollection.FindOne(nil, bson.D{{Key: "user_id", Value: userID}, {Key: "source", Value: "google"}}).Decode(&googleToken)

	if err != nil {
		log.Fatalf("Failed to fetch external API token: %v", err)
	}

	var token oauth2.Token
	json.Unmarshal([]byte(googleToken.Token), &token)
	config := GetGoogleConfig()
	client := config.Client(context.Background(), &token).(*http.Client)

	var calendarEvents = make(chan []*database.CalendarEvent)
	go LoadCalendarEvents(userID.(primitive.ObjectID), client, calendarEvents, nil)

	var emails = make(chan []*database.Email)
	go loadEmails(userID.(primitive.ObjectID), client, emails)

	var JIRATasks = make(chan []*database.Task)
	go LoadJIRATasks(api, externalAPITokenCollection, userID.(primitive.ObjectID), JIRATasks)

	allTasks := MergeTasks(<-calendarEvents, <-emails, <-JIRATasks, "gmail.com")

	c.JSON(200, allTasks)
}

func MergeTasks(calendarEvents []*database.CalendarEvent, emails []*database.Email, JIRATasks []*database.Task, userDomain string) []*database.TaskGroup {

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
				return compareTaskEmail(a.(*database.Task), b.(*database.Email), userDomain)
			}
		case *database.Email:
			switch b.(type) {
			case *database.Task:
				return !compareTaskEmail(b.(*database.Task), a.(*database.Email), userDomain)
			case *database.Email:
				return compareEmails(a.(*database.Email), b.(*database.Email), userDomain)
			}
		}
		return true
	})

	//we then fill in the gaps with calendar events with these tasks

	var tasks []*database.TaskBase
	var taskGroups []*database.TaskGroup

	lastEndTime := time.Now()
	taskIndex := 0
	calendarIndex := 0

	var totalDuration int64

	for ; calendarIndex < len(calendarEvents); calendarIndex++ {
		calendarEvent := calendarEvents[calendarIndex]

		if taskIndex >= len(allUnscheduledTasks) {
			break
		}

		remainingTime := calendarEvent.DatetimeStart.Time().Sub(lastEndTime)

		taskBase := getTaskBase(allUnscheduledTasks[taskIndex])
		timeAllocation := taskBase.TimeAllocation
		for remainingTime.Nanoseconds() >= timeAllocation {
			tasks = append(tasks,taskBase)
			remainingTime -= time.Duration(timeAllocation)
			totalDuration += timeAllocation
			taskIndex += 1
			if taskIndex >= len(allUnscheduledTasks) {
				break
			}
			taskBase = getTaskBase(allUnscheduledTasks[taskIndex])
			timeAllocation = taskBase.TimeAllocation
		}

		if len(tasks) > 0 {
			taskGroups = append(taskGroups, &database.TaskGroup{
				TaskGroupType: database.UnscheduledGroup,
				StartTime:     lastEndTime.String(),
				Duration:      totalDuration / int64(time.Second),
				Tasks:         tasks,
			})
			totalDuration = 0
			tasks = nil
		}

		taskGroups = append(taskGroups, &database.TaskGroup{
			TaskGroupType: database.ScheduledTask,
			StartTime:     calendarEvent.DatetimeStart.Time().String(),
			Duration:      int64(calendarEvent.DatetimeEnd.Time().Sub(calendarEvent.DatetimeStart.Time()).Seconds()),
			Tasks:         []*database.TaskBase{&calendarEvent.TaskBase},
		})

		lastEndTime = calendarEvent.DatetimeEnd.Time()
	}

	//add remaining calendar events, if they exist.
	for ; calendarIndex < len(calendarEvents); calendarIndex++ {
		calendarEvent := calendarEvents[calendarIndex]

		taskGroups = append(taskGroups, &database.TaskGroup{
			TaskGroupType: database.ScheduledTask,
			StartTime:     calendarEvent.DatetimeStart.Time().String(),
			Duration:      int64(calendarEvent.DatetimeEnd.Time().Sub(calendarEvent.DatetimeStart.Time()).Seconds()),
			Tasks:         []*database.TaskBase{&calendarEvent.TaskBase},
		})
		lastEndTime = calendarEvent.DatetimeEnd.Time()
	}

	//add remaining non scheduled events, if they exist.
	tasks = nil
	for ; taskIndex < len(allUnscheduledTasks); taskIndex++ {
		t := getTaskBase(allUnscheduledTasks[taskIndex])
		tasks = append(tasks, t)
	}
	if len(tasks) > 0 {
		taskGroups = append(taskGroups, &database.TaskGroup{
			TaskGroupType: database.UnscheduledGroup,
			StartTime:     lastEndTime.String(),
			Duration:      totalDuration / int64(time.Second),
			Tasks:         tasks,
		})
	}
	return taskGroups
}

func getTaskBase(t interface{}) *database.TaskBase {
	switch t.(type) {
	case *database.Email:
		return &(t.(*database.Email).TaskBase)
	case *database.Task:
		return &(t.(*database.Task).TaskBase)
	case *database.CalendarEvent:
		return &(t.(*database.CalendarEvent).TaskBase)
	default:
		return nil
	}
}

func compareEmails(e1 *database.Email, e2 *database.Email, myDomain string) bool {
	if e1.SenderDomain == myDomain && e2.SenderDomain != myDomain {
		return true
	} else if e1.SenderDomain != myDomain && e2.SenderDomain == myDomain {
		return false
	} else {
		return e1.TimeSent < e2.TimeSent
	}
}

func compareTasks(t1 *database.Task, t2 *database.Task) bool {
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
	} else if t1.Priority != t2.Priority {
		//if either have a priority, choose the one with the higher priority
		return t1.Priority > t2.Priority
	} else {
		//if all else fails prioritize by task number.
		return t1.TaskNumber < t2.TaskNumber
	}
}

func compareTaskEmail(t *database.Task, e *database.Email, myDomain string) bool {
	return e.SenderDomain != myDomain
}
