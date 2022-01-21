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

type messageSource struct {
	AccountId     string `json:"account_id"`
	Name          string `json:"name"`
	Logo          string `json:"logo"`
	IsCompletable bool   `json:"is_completable"`
	IsReplyable   bool   `json:"is_replyable"`
}

type message struct {
	ID       primitive.ObjectID `json:"id"`
	Title    string             `json:"title"`
	Deeplink string             `json:"deeplink"`
	Body     string             `json:"body"`
	Sender   string             `json:"sender"`
	SentAt   string             `json:"sent_at"`
	Source   messageSource      `json:"source"`
}

func (api *API) MessagesList(c *gin.Context) {
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

	orderedMessages, err := OrderMessages(
		db,
		currentTasks,
		emails,
		userID.(primitive.ObjectID),
	)
	if err != nil {
		Handle500(c)
		return
	}
	c.JSON(200, orderedMessages)
}

func OrderMessages(
	db *mongo.Database,
	currentTasks *[]database.TaskBase,
	emails []*database.Email,
	userID primitive.ObjectID,
) ([]*message, error) {
	// err := markCompletedMessages(db, currentTasks, &emails)
	// if err != nil {
	// 	return []*message{}, err
	// }

	orderingSetting, err := settings.GetUserSetting(db, userID, settings.SettingFieldEmailOrderingPreference)
	if err != nil {
		log.Printf("failed to fetch email ordering setting: %v", err)
		return []*message{}, err
	}
	newestEmailsFirst := *orderingSetting == settings.ChoiceKeyNewestFirst
	sort.SliceStable(emails, func(i, j int) bool {
		a := emails[i]
		b := emails[j]
		return compareEmails(a, b, newestEmailsFirst)
	})

	var messages []*message
	for _, email := range emails {
		messages = append(messages, emailToMessage(email))
	}
	return messages, nil
}

// func extractSectionTasksV2 ([]*TaskResultV2, []*TaskResultV2, []interface{}) {
// 	blockedTasks := make([]*TaskResultV2, 0)
// 	backlogTasks := make([]*TaskResultV2, 0)
// 	var allOtherTasks []interface{}
// 	for _, task := range *allUnscheduledTasks {
// 		switch task := task.(type) {
// 		case *database.Email:
// 			if task.IDTaskSection == constants.IDTaskSectionBlocked {
// 				blockedTasks = append(blockedTasks, taskBaseToTaskResultV2(&task.TaskBase))
// 				continue
// 			}
// 			if task.IDTaskSection == constants.IDTaskSectionBacklog {
// 				backlogTasks = append(backlogTasks, taskBaseToTaskResultV2(&task.TaskBase))
// 				continue
// 			}
// 		case *database.Task:
// 			if task.IDTaskSection == constants.IDTaskSectionBlocked {
// 				blockedTasks = append(blockedTasks, taskBaseToTaskResultV2(&task.TaskBase))
// 				continue
// 			}
// 			if task.IDTaskSection == constants.IDTaskSectionBacklog {
// 				backlogTasks = append(backlogTasks, taskBaseToTaskResultV2(&task.TaskBase))
// 				continue
// 			}
// 		}
// 		allOtherTasks = append(allOtherTasks, task)
// 	}
// 	return blockedTasks, backlogTasks, allOtherTasks
// }

func markCompletedMessages(
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

// func updateOrderingIDsV2(db *mongo.Database, tasks *[]*TaskResultV2) error {
// 	parentCtx := context.Background()
// 	tasksCollection := database.GetTaskCollection(db)
// 	orderingID := 1
// 	for _, task := range *tasks {
// 		task.IDOrdering = orderingID
// 		orderingID += 1
// 		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
// 		defer cancel()
// 		res, err := tasksCollection.UpdateOne(
// 			dbCtx,
// 			bson.M{"_id": task.ID},
// 			bson.M{"$set": bson.M{"id_ordering": task.IDOrdering}},
// 		)
// 		if err != nil {
// 			log.Printf("failed to update task ordering ID: %v", err)
// 			return err
// 		}
// 		if res.MatchedCount != 1 {
// 			log.Printf("did not find task to update ordering ID (ID=%v)", task.ID)
// 		}
// 	}
// 	return nil
// }

func emailToMessage(e *database.Email) *message {
	// Normally we need to use api.ExternalConfig but we are just using the source details constants here
	messageSourceResult, _ := external.GetConfig().GetTaskSourceResult(e.SourceID)
	return &message{
		ID:       e.ID,
		Title:    e.Title,
		Deeplink: e.Deeplink,
		Body:     e.Body,
		Sender:   e.Sender,
		SentAt:   e.CreatedAtExternal.Time().Format(time.RFC3339),
		Source: messageSource{
			AccountId:     e.SourceAccountID,
			Name:          messageSourceResult.Details.Name,
			Logo:          messageSourceResult.Details.Logo,
			IsCompletable: messageSourceResult.Details.IsCreatable,
			IsReplyable:   messageSourceResult.Details.IsReplyable,
		},
	}
}
