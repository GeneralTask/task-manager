package external

import (
	"context"
	"log"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
)

func TestLoadGeneralTaskTasks(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	log.Println(parentCtx, db)
	assert.Equal(t, 1, 2)
}
