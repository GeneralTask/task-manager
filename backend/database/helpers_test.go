package database

import (
	"log"
	"testing"

	"github.com/go-playground/assert/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestGetActiveTasks(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		db, dbCleanup := GetDBConnection()
		defer dbCleanup()
		userID := primitive.NewObjectID()
		notUserID := primitive.NewObjectID()
		task1 := GetOrCreateTask(
			db,
			userID,
			"123abc",
			TaskSourceGmail.Name,
			&Email{TaskBase: TaskBase{
				IDExternal: "123abc",
				Source:     TaskSourceGmail.Name,
				UserID:     userID,
			}},
		)
		GetOrCreateTask(
			db,
			notUserID,
			"123abd",
			TaskSourceGmail.Name,
			&Email{TaskBase: TaskBase{
				IDExternal: "123abd",
				Source:     TaskSourceGmail.Name,
				UserID:     notUserID,
			}},
		)
		GetOrCreateTask(
			db,
			userID,
			"123abe",
			TaskSourceGmail.Name,
			&Email{TaskBase: TaskBase{
				IDExternal:  "123abe",
				IsCompleted: true,
				Source:      TaskSourceGmail.Name,
				UserID:      userID,
			}},
		)
		tasks := GetActiveTasks(db, userID)
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
