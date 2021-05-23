package database

import (
	"log"
	"os"
	"testing"
)

func TestMain(m *testing.M) {
	db, dbCleanup := GetDBConnection()
	defer dbCleanup()
	log.Println("Dropping test DB now.")
	err := db.Drop(context.TODO())
	if err != nil {
		log.Fatalf("Failed to wipe test DB: %v", err)
	}
	os.Exit(m.Run())
}
