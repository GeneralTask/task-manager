package api

import (
	"time"

	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/GeneralTask/task-manager/backend/utils"

	"github.com/GeneralTask/task-manager/backend/database"
	"go.mongodb.org/mongo-driver/bson/primitive"
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
	// case *database.Email:
	case *database.TaskRecord:
		return &(t.TaskBase)
	case *database.Task:
		return &(t.TaskBase)
	case *database.CalendarEvent:
		return &(t.TaskBase)
	default:
		return nil
	}
}

func compareEmails(e1 *database.TaskRecord, e2 *database.TaskRecord, newestEmailsFirst bool) bool {
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

func compareTaskEmail(t *database.Task, e *database.TaskRecord) bool {
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
