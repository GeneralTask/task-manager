package database

import (
	"log"
	"testing"

	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestGetActiveTasks(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		exampleTaskSource := TaskSource{}
		db, dbCleanup, err := GetDBConnection()
		assert.NoError(t, err)
		defer dbCleanup()
		userID := primitive.NewObjectID()
		notUserID := primitive.NewObjectID()
		task1, err := GetOrCreateTask(
			db,
			userID,
			"123abc",
			exampleTaskSource,
			&Email{TaskBase: TaskBase{
				IDExternal: "123abc",
				Source:     exampleTaskSource,
				UserID:     userID,
			}},
		)
		assert.NoError(t, err)
		_, err = GetOrCreateTask(
			db,
			notUserID,
			"123abd",
			exampleTaskSource,
			&Email{TaskBase: TaskBase{
				IDExternal: "123abd",
				Source:     exampleTaskSource,
				UserID:     notUserID,
			}},
		)
		assert.NoError(t, err)
		_, err = GetOrCreateTask(
			db,
			userID,
			"123abe",
			exampleTaskSource,
			&Email{TaskBase: TaskBase{
				IDExternal:  "123abe",
				IsCompleted: true,
				Source:      exampleTaskSource,
				UserID:      userID,
			}},
		)
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
		assert.Equal(t, task1.ID, (*tasks)[0].ID)
	})
}
