package database

import (
	"log"
	"testing"

	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestCreatedAtTask(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		db, dbCleanup, err := GetDBConnection()
		assert.NoError(t, err)
		defer dbCleanup()
		userID := primitive.NewObjectID()
		task1, err := GetOrCreateTask(
			db,
			userID,
			"123abc",
			"foobar_source",
			&Email{TaskBase: TaskBase{
				IDExternal: "123abc",
				SourceID:   "foobar_source",
				UserID:     userID,
			}},
		)
		assert.NoError(t, err)
		tasks, err := GetActiveTasks(db, userID)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(*tasks))
		assert.Equal(t, task1.ID, (*tasks)[0].ID)

		postDBTask := (*tasks)[0]

		log.Println("task:" + postDBTask.ID.Hex())
		log.Println("Created At TEST:", postDBTask.History.CreatedAt)
		log.Println("Updated At TEST:", postDBTask.History.UpdatedAt)
		history, err := postDBTask.GetBSON()
		assert.NoError(t, err)
		log.Println("history:", history)
		assert.NotEqual(t, postDBTask.History.CreatedAt, primitive.DateTime(0))
		assert.NotEqual(t, postDBTask.History.UpdatedAt, primitive.DateTime(0))
		assert.Equal(t, true, false)
	})
}
