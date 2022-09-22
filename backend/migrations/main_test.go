package migrations

import (
	"context"
	"os"
	"testing"

	"github.com/rs/zerolog/log"

	"github.com/GeneralTask/task-manager/backend/database"
)

func TestMain(m *testing.M) {
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		log.Fatal().Msgf("Failed to connect to DB")
	}
	defer dbCleanup()
	log.Print("Dropping test DB now.")
	err = db.Drop(context.Background())
	if err != nil {
		log.Fatal().Msgf("Failed to wipe test DB")
	}
	os.Exit(m.Run())
}
