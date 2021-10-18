package database

import (
	"context"
	"log"
	"testing"

	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestCreatedAtTask(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		db, dbCleanup, err := GetDBConnection()
		assert.NoError(t, err)
		defer dbCleanup()
		userID := primitive.NewObjectID()
		sourceID := primitive.NewObjectID()
		taskCollection := GetTaskCollection(db)
		dbQuery := []bson.M{
			{"id_external": "8008135"},
			{"source_id": sourceID},
			{"user_id": userID},
		}
		_, err = taskCollection.InsertOne(context.TODO(), dbQuery)
		assert.NoError(t, err)
		tasks, err := GetActiveTasks(db, userID)
		assert.NoError(t, err)
		log.Println("user ID:" + userID.Hex())
		for _, task := range *tasks {
			log.Println("task:" + task.ID.Hex())
			log.Println(task.UserID)
			log.Println(task.IsCompleted)
		}
		assert.Equal(t, 1, len(*tasks))
		assert.Equal(t, true, false)
	})
}
