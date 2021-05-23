package database

import (
	"context"
	"errors"
	"log"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func UpdateOrCreateTask(
	db *mongo.Database,
	userID primitive.ObjectID,
	IDExternal string,
	source TaskSource,
	fieldsToInsertIfMissing interface{},
	fieldsToUpdate interface{},
) (*mongo.SingleResult, error) {
	taskCollection := getTaskCollection(db)
	dbQuery := bson.M{
		"$and": []bson.M{
			{"id_external": IDExternal},
			{"source.name": source.Name},
			{"user_id": userID},
		},
	}
	// Unfortunately you cannot put both $set and $setOnInsert so they are separate operations
	_, err := taskCollection.UpdateOne(
		context.TODO(),
		dbQuery,
		bson.D{
			{Key: "$setOnInsert", Value: fieldsToInsertIfMissing},
		},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		log.Printf("Failed to update or create task: %v", err)
		return nil, err
	}

	return taskCollection.FindOneAndUpdate(
		context.TODO(),
		dbQuery,
		bson.D{
			{Key: "$set", Value: fieldsToUpdate},
		},
	), nil
}

func GetOrCreateTask(db *mongo.Database,
	userID primitive.ObjectID,
	IDExternal string,
	source TaskSource,
	fieldsToInsertIfMissing interface{},
) (*TaskBase, error) {
	taskCollection := getTaskCollection(db)
	dbQuery := bson.M{
		"$and": []bson.M{
			{"id_external": IDExternal},
			{"source.name": source.Name},
			{"user_id": userID},
		},
	}
	// Unfortunately you cannot put both $set and $setOnInsert so they are separate operations
	_, err := taskCollection.UpdateOne(
		context.TODO(),
		dbQuery,
		bson.D{
			{Key: "$setOnInsert", Value: fieldsToInsertIfMissing},
		},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		log.Printf("Failed to get or create task: %v", err)
		return nil, err
	}

	var task TaskBase
	err = taskCollection.FindOne(
		context.TODO(),
		dbQuery,
	).Decode(&task)
	if err != nil {
		log.Printf("Failed to get task: %v", err)
		return nil, err
	}

	return &task, nil
}

func GetActiveTasks(db *mongo.Database, userID primitive.ObjectID) (*[]TaskBase, error) {
	cursor, err := getTaskCollection(db).Find(
		context.TODO(),
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
	err = cursor.All(context.TODO(), &tasks)
	if err != nil {
		log.Printf("Failed to fetch tasks for user: %v", err)
		return nil, err
	}
	return &tasks, nil
}

func GetUser(db *mongo.Database, userID primitive.ObjectID) (*User, error) {
	var userObject User
	err := getUserCollection(db).FindOne(
		context.TODO(),
		bson.D{{Key: "_id", Value: userID}},
	).Decode(&userObject)
	if err != nil {
		log.Printf("Failed to load user: %v", err)
		return nil, err
	}
	return &userObject, nil
}

func CreateStateToken(db *mongo.Database, userID *primitive.ObjectID) (*string, error) {
	stateToken := &StateToken{}
	if userID != nil {
		stateToken.UserID = *userID
	}
	cursor, err := getStateTokenCollection(db).InsertOne(context.TODO(), stateToken)
	if err != nil {
		log.Printf("Failed to create new state token: %v", err)
		return nil, err
	}
	stateTokenStr := cursor.InsertedID.(primitive.ObjectID).Hex()
	return &stateTokenStr, nil
}

func DeleteStateToken(db *mongo.Database, stateTokenID primitive.ObjectID, userID *primitive.ObjectID) error {
	var deletionQuery bson.D
	if userID == nil {
		deletionQuery = bson.D{{Key: "_id", Value: stateTokenID}}
	} else {
		deletionQuery = bson.D{{Key: "user_id", Value: *userID}, {Key: "_id", Value: stateTokenID}}
	}
	result, err := getStateTokenCollection(db).DeleteOne(context.TODO(), deletionQuery)
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
