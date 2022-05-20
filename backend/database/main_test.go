package database

import (
	"context"
	"os"
	"testing"

	"github.com/rs/zerolog/log"

	"github.com/GeneralTask/task-manager/backend/constants"
)

func TestMain(m *testing.M) {
	parentCtx := context.Background()
	db, dbCleanup, err := GetDBConnection()
	if err != nil {
		log.Fatal().Err(err).Msg("failed to connect to DB")
	}
	defer dbCleanup()
	log.Print("Dropping test DB now.")
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = db.Drop(dbCtx)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to wipe test DB")
	}
	os.Exit(m.Run())
}
