package database

import (
	"context"
	"os"
	"testing"

	"github.com/rs/zerolog/log"
)

func TestMain(m *testing.M) {
	db, dbCleanup, err := GetDBConnection()
	if err != nil {
		log.Fatal().Err(err).Msg("failed to connect to DB")
	}
	defer dbCleanup()
	log.Print("Dropping test DB now.")
	err = db.Drop(context.Background())
	if err != nil {
		log.Fatal().Err(err).Msg("failed to wipe test DB")
	}
	os.Exit(m.Run())
}
