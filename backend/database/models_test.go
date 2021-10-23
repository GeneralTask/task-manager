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
		postDBTask := (*tasks)[0]
		assert.Equal(t, task1.ID, postDBTask.ID)

		assert.NotEqual(t, primitive.DateTime(0), postDBTask.History.CreatedAt)
		assert.NotEqual(t, primitive.DateTime(0), postDBTask.History.UpdatedAt)

		UpdateOrCreateTask(db, userID, "123abc", "foobar_source", Task{}, TaskChangeableFields{})
		tasks, err = GetActiveTasks(db, userID)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(*tasks))
		postDBTaskUpdated := (*tasks)[0]
		assert.Equal(t, task1.ID, postDBTaskUpdated.ID)
		log.Println("postDBTaskUpdated:", postDBTaskUpdated.History.CreatedAt, postDBTaskUpdated.History.UpdatedAt)
		assert.Equal(t, postDBTask.History.CreatedAt, postDBTaskUpdated.History.CreatedAt)
		assert.NotEqual(t, postDBTask.History.UpdatedAt, postDBTaskUpdated.History.UpdatedAt)
	})
}
