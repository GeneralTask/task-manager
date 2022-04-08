package api

import (
	"context"
	"log"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/external"

	"github.com/GeneralTask/task-manager/backend/database"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type TaskSource struct {
	Name          string `json:"name"`
	Logo          string `json:"logo"`
	LogoV2        string `json:"logo_v2"`
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
	Recipients     Recipients         `json:"recipients"`
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

type Recipients struct {
	To  []Recipient `json:"to"`
	Cc  []Recipient `json:"cc"`
	Bcc []Recipient `json:"bcc"`
}

type Recipient struct {
	Name  string `json:"name"`
	Email string `json:"email"`
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

func (api *API) fetchTasks(parentCtx context.Context, db *mongo.Database, userID interface{}) (*[]*database.Item, map[string]bool, error) {
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
		return nil, nil, err
	}
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = cursor.All(dbCtx, &tokens)
	if err != nil {
		log.Printf("failed to iterate through api tokens: %v", err)
		return nil, nil, err
	}
	// add dummy token for gt_task fetch logic
	tokens = append(tokens, database.ExternalAPIToken{
		AccountID: external.GeneralTaskDefaultAccountID,
		ServiceID: external.TASK_SERVICE_ID_GT,
	})

	taskChannels := []chan external.TaskResult{}
	pullRequestChannels := []chan external.PullRequestResult{}
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

			var pullRequests = make(chan external.PullRequestResult)
			go taskSource.GetPullRequests(userID.(primitive.ObjectID), token.AccountID, pullRequests)
			pullRequestChannels = append(pullRequestChannels, pullRequests)
		}
	}

	tasks := []*database.Item{}
	failedFetchSources := make(map[string]bool)
	for _, taskChannel := range taskChannels {
		taskResult := <-taskChannel
		if taskResult.Error != nil {
			failedFetchSources[taskResult.SourceID] = true
			continue
		}
		tasks = append(tasks, taskResult.Tasks...)
	}
	for _, pullRequestChannel := range pullRequestChannels {
		pullRequestResult := <-pullRequestChannel
		if pullRequestResult.Error != nil {
			continue
		}
		for _, pullRequest := range pullRequestResult.PullRequests {
			tasks = append(tasks, &database.Item{
				TaskBase: pullRequest.TaskBase,
			})
		}
	}
	return &tasks, failedFetchSources, nil
}

func adjustForCompletedTasks(
	db *mongo.Database,
	currentTasks *[]database.Item,
	fetchedTasks *[]*database.Item,
	failedFetchSources map[string]bool,
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
		if !newTaskIDs[currentTask.TaskBase.ID] && !currentTask.IsMessage && !failedFetchSources[currentTask.SourceID] {
			err := database.MarkItemComplete(db, currentTask.TaskBase.ID)
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

func (api *API) taskBaseToTaskResult(t *database.Item) *TaskResult {
	taskSourceResult, _ := api.ExternalConfig.GetTaskSourceResult(t.SourceID)
	var dueDate string
	if t.DueDate.Time().Unix() == int64(0) {
		dueDate = ""
	} else {
		dueDate = t.DueDate.Time().Format("2006-01-02")
	}

	return &TaskResult{
		ID:         t.TaskBase.ID,
		IDOrdering: t.IDOrdering,
		Source: TaskSource{
			Name:          taskSourceResult.Details.Name,
			Logo:          taskSourceResult.Details.Logo,
			LogoV2:        taskSourceResult.Details.LogoV2,
			IsCompletable: taskSourceResult.Details.IsCompletable,
			IsReplyable:   taskSourceResult.Details.IsReplyable,
		},
		Deeplink:       t.Deeplink,
		Title:          t.Title,
		Body:           t.TaskBase.Body,
		TimeAllocation: t.TimeAllocation,
		Sender:         t.Sender,
		Recipients: Recipients{
			To:  getRecipients(t.Recipients.To),
			Cc:  getRecipients(t.Recipients.Cc),
			Bcc: getRecipients(t.Recipients.Bcc),
		},
		SentAt:  t.CreatedAtExternal.Time().UTC().Format(time.RFC3339),
		DueDate: dueDate,
		IsDone:  t.IsCompleted,
	}
}
