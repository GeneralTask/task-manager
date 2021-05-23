package api

import (
	"context"
	"log"
	"os"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
)

func TestMain(m *testing.M) {
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		log.Fatalf("Failed to connect to DB: %v", err)
	}
	defer dbCleanup()
	log.Println("Dropping test DB now.")
	err = db.Drop(context.TODO())
	if err != nil {
		log.Fatalf("Failed to wipe test DB: %v", err)
	}
	os.Exit(m.Run())
}
