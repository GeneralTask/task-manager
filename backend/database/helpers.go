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

func UpdateOrCreatePullRequest(
	db *mongo.Database,
	userID primitive.ObjectID,
	IDExternal string,
	sourceID string,
	fieldsToInsertIfMissing interface{},
	fieldsToUpdate interface{},
) (*mongo.SingleResult, error) {
	parentCtx := context.Background()
	prCollection := GetPullRequestCollection(db)
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
	_, err := prCollection.UpdateOne(
		dbCtx,
		dbQuery,
		bson.M{"$setOnInsert": fieldsToInsertIfMissing},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		log.Printf("Failed to update or create task: %v", err)
		return nil, err
	}

	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	return prCollection.FindOneAndUpdate(
		dbCtx,
		dbQuery,
		bson.M{"$set": fieldsToUpdate},
	), nil
}

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
	log.Printf("fieldsToInsertIfMissing  %+v", fieldsToInsertIfMissing)
	log.Printf("fieldsToInsertIfMissing  %+v", fieldsToInsertIfMissing)
	log.Printf("IDExternal  %+v", IDExternal)
	log.Printf("fieldsToUpdate  %+v", fieldsToUpdate)
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

func GetActiveTasks(db *mongo.Database, userID primitive.ObjectID) (*[]TaskBase, error) {
	parentCtx := context.Background()
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	cursor, err := GetTaskCollection(db).Find(
		dbCtx,
		bson.M{
			"$and": []bson.M{
				{"user_id": userID},
				{"is_completed": false},
				// Small hack to filter emails out from tasks collection - better would be to have a separate messages collection
				{"email.sender_domain": bson.M{"$exists": false}},
			},
		},
	)
	if err != nil {
		log.Printf("Failed to fetch tasks for user: %v", err)
		return nil, err
	}
	var tasks []TaskBase
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = cursor.All(dbCtx, &tasks)
	if err != nil {
		log.Printf("Failed to fetch tasks for user: %v", err)
		return nil, err
	}
	return &tasks, nil
}

func GetActiveEmails(db *mongo.Database, userID primitive.ObjectID) (*[]Item, error) {
	parentCtx := context.Background()
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	cursor, err := GetTaskCollection(db).Find(
		dbCtx,
		bson.M{
			"$and": []bson.M{
				{"user_id": userID},
				{"is_completed": false},
				// Use this small hack to filter emails from tasks collection - better would be to have a separate messages collection
				{"email.sender_domain": bson.M{"$exists": true}},
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

func CreateStateToken(db *mongo.Database, userID *primitive.ObjectID) (*string, error) {
	parentCtx := context.Background()
	stateToken := &StateToken{}
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
