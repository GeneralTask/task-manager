package api

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"sort"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/oauth2"
)

func (api *API) tasksList(c *gin.Context) {
	db, dbCleanup := GetDBConnection()
	defer dbCleanup()
	externalAPITokenCollection := db.Collection("external_api_tokens")
	var googleToken ExternalAPIToken
	userID, _ := c.Get("user")
	err := externalAPITokenCollection.FindOne(nil, bson.D{{Key: "user_id", Value: userID}, {Key: "source", Value: "google"}}).Decode(&googleToken)

	if err != nil {
		log.Fatalf("Failed to fetch external API token: %v", err)
	}

	var token oauth2.Token
	json.Unmarshal([]byte(googleToken.Token), &token)
	config := getGoogleConfig()
	client := config.Client(context.Background(), &token).(*http.Client)

	var calendarEvents = make(chan []*CalendarEvent)
	go loadCalendarEvents(client, calendarEvents, nil)

	var emails = make(chan []*Email)
	go loadEmails(c, client, emails)

	var JIRATasks = make(chan []*Task)
	go loadJIRATasks(api, externalAPITokenCollection, userID.(primitive.ObjectID), JIRATasks)

	allTasks := mergeTasks(<-calendarEvents, <-emails, <-JIRATasks, "gmail.com")
	c.JSON(200, allTasks)
}

func mergeTasks(calendarEvents []*CalendarEvent, emails []*Email, JIRATasks []*Task, userDomain string) []*TaskGroup {

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
		case *Task:
			switch b.(type) {
			case *Task:
				return compareTasks(a.(*Task), b.(*Task))
			case *Email:
				return compareTaskEmail(a.(*Task), b.(*Email), userDomain)
			}
		case *Email:
			switch b.(type) {
			case *Task:
				return !compareTaskEmail(b.(*Task), a.(*Email), userDomain)
			case *Email:
				return compareEmails(a.(*Email), b.(*Email), userDomain)
			}
		}
		return true
	})

	//we then fill in the gaps with calendar events with these tasks

	var tasks []interface{}
	taskGroups := []*TaskGroup{}

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

		timeAllocation := getTimeAllocation(allUnscheduledTasks[taskIndex])
		for remainingTime.Nanoseconds() >= timeAllocation {
			tasks = append(tasks, allUnscheduledTasks[taskIndex])
			remainingTime -= time.Duration(timeAllocation)
			totalDuration += timeAllocation
			taskIndex += 1
			if taskIndex >= len(allUnscheduledTasks) {
				break
			}
			timeAllocation = getTimeAllocation(allUnscheduledTasks[taskIndex])
		}

		if len(tasks) > 0 {
			taskGroups = append(taskGroups, &TaskGroup{
				TaskGroupType: UnscheduledGroup,
				StartTime:     lastEndTime.String(),
				Duration:      totalDuration / int64(time.Second),
				Tasks:         tasks,
			})
			totalDuration = 0
			tasks = nil
		}

		taskGroups = append(taskGroups, &TaskGroup{
			TaskGroupType: ScheduledTask,
			StartTime:     calendarEvent.DatetimeStart.Time().String(),
			Duration:      int64(calendarEvent.DatetimeEnd.Time().Sub(calendarEvent.DatetimeStart.Time()).Seconds()),
			Tasks:         []interface{}{calendarEvent},
		})

		lastEndTime = calendarEvent.DatetimeEnd.Time()
	}

	//add remaining calendar events, if they exist.
	for ; calendarIndex < len(calendarEvents); calendarIndex++ {
		calendarEvent := calendarEvents[calendarIndex]

		taskGroups = append(taskGroups, &TaskGroup{
			TaskGroupType: ScheduledTask,
			StartTime:     calendarEvent.DatetimeStart.Time().String(),
			Duration:      int64(calendarEvent.DatetimeEnd.Time().Sub(calendarEvent.DatetimeStart.Time()).Seconds()),
			Tasks:         []interface{}{calendarEvent},
		})
		lastEndTime = calendarEvent.DatetimeEnd.Time()
	}

	//add remaining non scheduled events, if they exist.
	tasks = nil
	for ; taskIndex < len(allUnscheduledTasks); taskIndex++ {
		t := allUnscheduledTasks[taskIndex]
		tasks = append(tasks, t)
		totalDuration += getTimeAllocation(t)
	}
	if len(tasks) > 0 {
		taskGroups = append(taskGroups, &TaskGroup{
			TaskGroupType: UnscheduledGroup,
			StartTime:     lastEndTime.String(),
			Duration:      totalDuration / int64(time.Second),
			Tasks:         tasks,
		})
	}
	return taskGroups
}

func getTimeAllocation(t interface{}) int64 {
	//We can't just cast this to TaskBase so we need to switch
	switch t.(type) {
	case *Email:
		return t.(*Email).TimeAllocation
	case *Task:
		return t.(*Task).TimeAllocation
	default:
		return 0
	}
}

func compareEmails(e1 *Email, e2 *Email, myDomain string) bool {
	if e1.SenderDomain == myDomain && e2.SenderDomain != myDomain {
		return true
	} else if e1.SenderDomain != myDomain && e2.SenderDomain == myDomain {
		return false
	} else {
		return e1.TimeSent < e2.TimeSent
	}
}

func compareTasks(t1 *Task, t2 *Task) bool {
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

func compareTaskEmail(t *Task, e *Email, myDomain string) bool {
	return e.SenderDomain != myDomain
}
