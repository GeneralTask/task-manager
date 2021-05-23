package database

import (
	"context"
	"log"
	"os"
	"testing"
)

func TestMain(m *testing.M) {
	db, dbCleanup, err := GetDBConnection()
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
