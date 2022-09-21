package migrations

import (
	"context"
	"testing"

	"github.com/GeneralTask/task-manager/backend/external"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/GeneralTask/task-manager/backend/database"

	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
)

type Item struct {
	TaskBase `bson:",inline"`
	TaskType `bson:"task_type"`
	Task     `bson:"task,omitempty"`
}

type TaskType struct {
	IsTask    bool `bson:"is_task"`
	IsMessage bool `bson:"is_message"`
}

// Task json & mongo model
type TaskBase struct {
	ID               primitive.ObjectID `bson:"_id,omitempty"`
	UserID           primitive.ObjectID `bson:"user_id"`
	IDExternal       string             `bson:"id_external"`
	IDOrdering       int                `bson:"id_ordering"`
	IDTaskSection    primitive.ObjectID `bson:"id_task_section"`
	IsCompleted      bool               `bson:"is_completed"`
	Sender           string             `bson:"sender"`
	SourceID         string             `bson:"source_id"`
	SourceAccountID  string             `bson:"source_account_id"`
	Deeplink         string             `bson:"deeplink"`
	Title            string             `bson:"title"`
	Body             string             `bson:"body"`
	HasBeenReordered bool               `bson:"has_been_reordered"`
	DueDate          primitive.DateTime `bson:"due_date"`
	//time in nanoseconds
	TimeAllocation    int64              `bson:"time_allocated"`
	CreatedAtExternal primitive.DateTime `bson:"created_at_external"`
	CompletedAt       primitive.DateTime `bson:"completed_at"`
}

type Task struct {
	PriorityID         string                      `bson:"priority_id"`
	PriorityNormalized float64                     `bson:"priority_normalized"`
	TaskNumber         int                         `bson:"task_number"`
	Comments           *[]database.Comment         `bson:"comments"`
	Status             database.ExternalTaskStatus `bson:"status"`
	// Used to cache the current status before marking the task as done
	PreviousStatus  database.ExternalTaskStatus `bson:"previous_status"`
	CompletedStatus database.ExternalTaskStatus `bson:"completed_status"`
}

func TestMigrate010(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	migrate, err := getMigrate("")
	assert.NoError(t, err)
	err = migrate.Steps(1)
	assert.NoError(t, err)

	taskCollection := database.GetTaskCollection(db)

	t.Run("MigrateUp", func(t *testing.T) {
		taskID := primitive.NewObjectID()
		taskCollection.InsertOne(context.Background(), Item{
			TaskBase{
				ID:          taskID,
				SourceID:    external.TASK_SOURCE_ID_LINEAR,
				Title:       "HELLO",
				IsCompleted: false,
			},
			TaskType{
				IsTask: true,
			},
			Task{
				PriorityID: "priority1",
				Comments: &[]database.Comment{
					{
						Body: "THERE",
					},
				},
			},
		})

		filter := bson.M{}
		count, err := taskCollection.CountDocuments(context.Background(), filter)
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)

		err = migrate.Steps(1)
		assert.NoError(t, err)

		count, err = taskCollection.CountDocuments(context.Background(), filter)
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)

		var result database.Task
		err = taskCollection.FindOne(context.Background(), filter).Decode(&result)
		assert.NoError(t, err)
		assert.Equal(t, external.TASK_SOURCE_ID_LINEAR, result.SourceID)
		assert.Equal(t, database.Comment{Body: "THERE"}, (*result.Comments)[0])
		assert.Equal(t, false, *result.IsCompleted)
		assert.Equal(t, "HELLO", *result.Title)
		assert.Equal(t, "priority1", *result.PriorityID)
	})
	t.Run("MigrateDown", func(t *testing.T) {
		err = migrate.Steps(-1)
		assert.NoError(t, err)
	})
}
