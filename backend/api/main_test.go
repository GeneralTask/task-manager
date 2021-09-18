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
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		log.Fatalf("Failed to connect to DB: %v", err)
	}
	defer dbCleanup()

	log.Println("Dropping test DB now.")
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = db.Drop(dbCtx)
	if err != nil {
		log.Fatalf("Failed to wipe test DB: %v", err)
	}
	os.Exit(m.Run())
}
