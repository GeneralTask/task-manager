package database

import (
	"context"
	"github.com/rs/zerolog/log"
	"os"
	"testing"

	"github.com/GeneralTask/task-manager/backend/constants"
)

func TestMain(m *testing.M) {
	parentCtx := context.Background()
	db, dbCleanup, err := GetDBConnection()
	if err != nil {
		log.Fatal().Msgf("Failed to connect to DB")
	}
	defer dbCleanup()
	log.Print("Dropping test DB now.")
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = db.Drop(dbCtx)
	if err != nil {
		log.Fatal().Msgf("Failed to wipe test DB")
	}
	os.Exit(m.Run())
}
