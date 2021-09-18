package database

import (
	"context"
	"errors"
	"log"

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
	taskCollection := getTaskCollection(db)
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

	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
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
	taskCollection := getTaskCollection(db)
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
	cursor, err := getTaskCollection(db).Find(
		dbCtx,
		bson.M{
			"$and": []bson.M{
				{"user_id": userID},
				{"is_completed": false},
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

func GetUser(db *mongo.Database, userID primitive.ObjectID) (*User, error) {
	parentCtx := context.Background()
	var userObject User
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err := getUserCollection(db).FindOne(
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
	cursor, err := getStateTokenCollection(db).InsertOne(dbCtx, stateToken)
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
	result, err := getStateTokenCollection(db).DeleteOne(dbCtx, deletionQuery)
	if err != nil {
		log.Printf("Failed to delete state token: %v", err)
		return err
	}
	if result.DeletedCount != 1 {
		return errors.New("invalid state token")
	}
	return nil
}

func getStateTokenCollection(db *mongo.Database) *mongo.Collection {
	return db.Collection("state_tokens")
}

func getTaskCollection(db *mongo.Database) *mongo.Collection {
	return db.Collection("tasks")
}

func getUserCollection(db *mongo.Database) *mongo.Collection {
	return db.Collection("users")
}
