package api

import (
	"context"
	"log"
	"os"
	"testing"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
)

func TestMain(m *testing.M) {
	parent_ctx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		log.Fatalf("Failed to connect to DB: %v", err)
	}
	defer dbCleanup()

	log.Println("Dropping test DB now.")
	db_ctx, cancel := context.WithTimeout(parent_ctx, constants.DatabaseTimeout)
	defer cancel()
	err = db.Drop(db_ctx)
	if err != nil {
		log.Fatalf("Failed to wipe test DB: %v", err)
	}
	os.Exit(m.Run())
}
