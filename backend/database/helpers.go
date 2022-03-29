package database

import (
	"context"
	"errors"
	"log"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func UpdateOrCreateTask(
	db *mongo.Database,
	userID primitive.ObjectID,
	IDExternal string,
	sourceID string,
	fieldsToInsertIfMissing interface{},
	fieldsToUpdate interface{},
) (*mongo.SingleResult, error) {
	parentCtx := context.Background()
	taskCollection := GetTaskCollection(db)
	dbQuery := bson.M{
		"$and": []bson.M{
			{"id_external": IDExternal},
			{"source_id": sourceID},
			{"user_id": userID},
		},
	}
	// Unfortunately you cannot put both $set and $setOnInsert so they are separate operations
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	_, err := taskCollection.UpdateOne(
		dbCtx,
		dbQuery,
		bson.M{"$setOnInsert": fieldsToInsertIfMissing},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		log.Printf("Failed to update or create task: %v", err)
		return nil, err
	}

	return taskCollection.FindOneAndUpdate(
		dbCtx,
		dbQuery,
		bson.M{"$set": fieldsToUpdate},
	), nil
}

func GetItem(ctx context.Context, itemID primitive.ObjectID, userID primitive.ObjectID) (*Item, error) {
	parentCtx := ctx
	db, dbCleanup, err := GetDBConnection()
	if err != nil {
		log.Print("Failed to establish DB connection", err)
		return nil, err
	}
	defer dbCleanup()
	taskCollection := GetTaskCollection(db)

	var message Item
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = taskCollection.FindOne(
		dbCtx,
		bson.M{"$and": []bson.M{
			{"_id": itemID},
			{"user_id": userID},
		}}).Decode(&message)
	if err != nil {
		log.Printf("Failed to get item: %+v, error: %v", itemID, err)
		return nil, err
	}
	return &message, nil
}

func InsertEmailIfNotExist(db *mongo.Database,
	userID primitive.ObjectID,
	threadID string,
	emailID string,
	sourceID string,
	fieldsToInsertIfMissing interface{},
) (*Email, error) {
	parentCtx := context.Background()
	taskCollection := GetTaskCollection(db)
	filter := bson.M{
		"$and": []bson.M{
			{"email_thread.thread_id": threadID},
			{"source_id": sourceID},
			{"email_thread.emails.email_id": bson.M{"$ne": emailID}},
			{"user_id": userID},
		},
	}
	action := bson.M{
		"$push": bson.M{"email_thread.emails": fieldsToInsertIfMissing},
	}
	// Unfortunately you cannot put both $set and $setOnInsert so they are separate operations
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	_, err := taskCollection.UpdateOne(
		dbCtx,
		filter,
		action,
		options.Update().SetUpsert(true),
	)
	if err != nil {
		log.Printf("Failed to get or create task: %v", err)
		return nil, err
	}

	var task Email
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = taskCollection.FindOne(
		dbCtx,
		bson.M{
		"$and": []bson.M{
			{"email_thread.thread_id": threadID},
			{"source_id": sourceID},
			{"email_thread.emails.email_id": emailID},
			{"user_id": userID},
		},
	},
	).Decode(&task)
	if err != nil {
		log.Printf("Failed to get task: %v", err)
		return nil, err
	}

	return &task, nil
}

func GetOrCreateTask(db *mongo.Database,
	userID primitive.ObjectID,
	IDExternal string,
	sourceID string,
	fieldsToInsertIfMissing interface{},
) (*TaskBase, error) {
	parentCtx := context.Background()
	taskCollection := GetTaskCollection(db)
	dbQuery := bson.M{
		"$and": []bson.M{
			{"id_external": IDExternal},
			{"source_id": sourceID},
			{"user_id": userID},
		},
	}
	// Unfortunately you cannot put both $set and $setOnInsert so they are separate operations
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	_, err := taskCollection.UpdateOne(
		dbCtx,
		dbQuery,
		bson.M{"$setOnInsert": fieldsToInsertIfMissing},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		log.Printf("Failed to get or create task: %v", err)
		return nil, err
	}

	var task TaskBase
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = taskCollection.FindOne(
		dbCtx,
		dbQuery,
	).Decode(&task)
	if err != nil {
		log.Printf("Failed to get task: %v", err)
		return nil, err
	}

	return &task, nil
}

func GetActiveTasks(db *mongo.Database, userID primitive.ObjectID) (*[]Item, error) {
	parentCtx := context.Background()
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	cursor, err := GetTaskCollection(db).Find(
		dbCtx,
		bson.M{
			"$and": []bson.M{
				{"user_id": userID},
				{"is_completed": false},
				{"task_type.is_task": true},
			},
		},
	)
	if err != nil {
		log.Printf("Failed to fetch tasks for user: %v", err)
		return nil, err
	}
	var tasks []Item
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = cursor.All(dbCtx, &tasks)
	if err != nil {
		log.Printf("Failed to fetch tasks for user: %v", err)
		return nil, err
	}
	return &tasks, nil
}

func GetUnreadEmails(db *mongo.Database, userID primitive.ObjectID) (*[]Item, error) {
	parentCtx := context.Background()
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	cursor, err := GetTaskCollection(db).Find(
		dbCtx,
		bson.M{
			"$and": []bson.M{
				{"user_id": userID},
				{"task_type.is_message": true},
				{"email.is_unread": true},
			},
		},
	)
	if err != nil {
		log.Printf("Failed to fetch emails for user: %v", err)
		return nil, err
	}
	var activeEmails []Item
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = cursor.All(dbCtx, &activeEmails)
	if err != nil {
		log.Printf("Failed to fetch emails for user: %v", err)
		return nil, err
	}
	return &activeEmails, nil
}

func GetEmails(db *mongo.Database, userID primitive.ObjectID, onlyUnread bool, pagination Pagination) (*[]Item, error) {
	parentCtx := context.Background()
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	opts := options.FindOptions{
		Sort: bson.D{{Key: "created_at_external", Value: -1}},
	}
	if IsValidPagination(pagination) {
		limit := int64(*pagination.Limit)
		skip := int64(*pagination.Page - 1) * limit
		opts.Skip = &skip
		opts.Limit = &limit
	}
	filter := bson.M{
		"$and": []bson.M{
			{"user_id": userID},
			{"task_type.is_message": true},
		},
	}
	if onlyUnread {
		filter["$and"] = append(filter["$and"].([]bson.M), bson.M{"email.is_unread": true})
	}
	cursor, err := GetTaskCollection(db).Find(
		dbCtx,
		filter,
		&opts,
	)
	if err != nil {
		log.Printf("Failed to fetch emails for user: %v with pagination: %v", err, pagination)
		return nil, err
	}
	var activeEmails []Item
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = cursor.All(dbCtx, &activeEmails)
	if err != nil {
		log.Printf("Failed to fetch emails for user: %v with pagination: %v", err, pagination)
		return nil, err
	}
	return &activeEmails, nil
}

func GetCompletedTasks(db *mongo.Database, userID primitive.ObjectID) (*[]Item, error) {
	parentCtx := context.Background()

	findOptions := options.Find()
	findOptions.SetSort(bson.D{{Key: "completed_at", Value: -1}, {Key: "_id", Value: -1}})

	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	cursor, err := GetTaskCollection(db).Find(
		dbCtx,
		bson.M{
			"$and": []bson.M{
				{"user_id": userID},
				{"is_completed": true},
				{"task_type.is_task": true},
			},
		},
		findOptions,
	)
	if err != nil {
		log.Printf("Failed to fetch tasks for user: %v", err)
		return nil, err
	}
	var tasks []Item
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = cursor.All(dbCtx, &tasks)
	if err != nil {
		log.Printf("Failed to fetch tasks for user: %v", err)
		return nil, err
	}
	return &tasks, nil
}

func GetTaskSections(db *mongo.Database, userID primitive.ObjectID) (*[]TaskSection, error) {
	parentCtx := context.Background()
	sectionCollection := GetTaskSectionCollection(db)

	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	cursor, err := sectionCollection.Find(
		dbCtx,
		bson.M{"user_id": userID},
	)
	if err != nil {
		log.Printf("failed to fetch sections for user: %+v", err)
		return nil, err
	}
	var sections []TaskSection
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = cursor.All(dbCtx, &sections)
	if err != nil {
		log.Printf("failed to fetch sections for user: %v", err)
		return nil, err
	}
	return &sections, nil
}

func MarkItemComplete(db *mongo.Database, itemID primitive.ObjectID) error {
	parentCtx := context.Background()
	tasksCollection := GetTaskCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	res, err := tasksCollection.UpdateOne(
		dbCtx,
		bson.M{"_id": itemID},
		bson.M{"$set": bson.M{
			"is_completed": true,
			"completed_at": primitive.NewDateTimeFromTime(time.Now()),
		}},
	)
	if err != nil {
		return err
	}
	if res.MatchedCount != 1 {
		return errors.New("did not find item to mark complete")
	}
	return nil
}

func GetUser(db *mongo.Database, userID primitive.ObjectID) (*User, error) {
	parentCtx := context.Background()
	var userObject User
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err := GetUserCollection(db).FindOne(
		dbCtx,
		bson.M{"_id": userID},
	).Decode(&userObject)
	if err != nil {
		log.Printf("Failed to load user: %v", err)
		return nil, err
	}
	return &userObject, nil
}

func CreateStateToken(db *mongo.Database, userID *primitive.ObjectID, useDeeplink bool) (*string, error) {
	parentCtx := context.Background()
	stateToken := &StateToken{UseDeeplink: useDeeplink}
	if userID != nil {
		stateToken.UserID = *userID
	}
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	cursor, err := GetStateTokenCollection(db).InsertOne(dbCtx, stateToken)
	if err != nil {
		log.Printf("Failed to create new state token: %v", err)
		return nil, err
	}
	stateTokenStr := cursor.InsertedID.(primitive.ObjectID).Hex()
	return &stateTokenStr, nil
}

func GetStateToken(db *mongo.Database, stateTokenID primitive.ObjectID, userID *primitive.ObjectID) (*StateToken, error) {
	parentCtx := context.Background()
	var query bson.M
	if userID == nil {
		query = bson.M{"_id": stateTokenID}
	} else {
		query = bson.M{"$and": []bson.M{{"user_id": *userID}, {"_id": stateTokenID}}}
	}
	var token StateToken
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err := GetStateTokenCollection(db).FindOne(dbCtx, query).Decode(&token)
	if err != nil {
		log.Printf("Failed to get state token: %v", err)
		return nil, err
	}
	return &token, nil
}

func DeleteStateToken(db *mongo.Database, stateTokenID primitive.ObjectID, userID *primitive.ObjectID) error {
	parentCtx := context.Background()
	var deletionQuery bson.M
	if userID == nil {
		deletionQuery = bson.M{"_id": stateTokenID}
	} else {
		deletionQuery = bson.M{"$and": []bson.M{{"user_id": *userID}, {"_id": stateTokenID}}}
	}
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	result, err := GetStateTokenCollection(db).DeleteOne(dbCtx, deletionQuery)
	if err != nil {
		log.Printf("Failed to delete state token: %v", err)
		return err
	}
	if result.DeletedCount != 1 {
		return errors.New("invalid state token")
	}
	return nil
}

func InsertLogEvent(db *mongo.Database, userID primitive.ObjectID, eventType string) error {
	dbCtx, cancel := context.WithTimeout(context.Background(), constants.DatabaseTimeout)
	defer cancel()
	_, err := GetLogEventsCollection(db).InsertOne(dbCtx, &LogEvent{
		UserID:    userID,
		EventType: eventType,
		CreatedAt: primitive.NewDateTimeFromTime(time.Now()),
	})
	return err
}

func GetStateTokenCollection(db *mongo.Database) *mongo.Collection {
	return db.Collection("state_tokens")
}

func GetTaskCollection(db *mongo.Database) *mongo.Collection {
	return db.Collection("tasks")
}

func GetUserCollection(db *mongo.Database) *mongo.Collection {
	return db.Collection("users")
}

func GetExternalTokenCollection(db *mongo.Database) *mongo.Collection {
	return db.Collection("external_api_tokens")
}

func GetPullRequestCollection(db *mongo.Database) *mongo.Collection {
	return db.Collection("pull_requests")
}

func GetUserSettingsCollection(db *mongo.Database) *mongo.Collection {
	return db.Collection("user_settings")
}

func GetInternalTokenCollection(db *mongo.Database) *mongo.Collection {
	return db.Collection("internal_api_tokens")
}

func GetWaitlistCollection(db *mongo.Database) *mongo.Collection {
	return db.Collection("waitlist")
}

func GetJiraSitesCollection(db *mongo.Database) *mongo.Collection {
	return db.Collection("jira_sites")
}

func GetJiraPrioritiesCollection(db *mongo.Database) *mongo.Collection {
	return db.Collection("jira_priorities")
}

func GetOauth1RequestsSecretsCollection(db *mongo.Database) *mongo.Collection {
	return db.Collection("oauth1_request_secrets")
}

func GetLogEventsCollection(db *mongo.Database) *mongo.Collection {
	return db.Collection("log_events")
}

func GetFeedbackItemCollection(db *mongo.Database) *mongo.Collection {
	return db.Collection("feedback_items")
}

func GetTaskSectionCollection(db *mongo.Database) *mongo.Collection {
	return db.Collection("task_sections")
}

func IsValidPagination(pagination Pagination) bool {
	if pagination.Limit == nil || pagination.Page == nil {
		return false
	}
	return *pagination.Limit > 0 && *pagination.Page > 0
}
