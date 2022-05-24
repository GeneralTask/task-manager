package api

import (
	"context"
	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/rs/zerolog/log"
	"os"
	"os/exec"
	"testing"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
)

func TestMain(m *testing.M) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
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

// sampled from https://stackoverflow.com/questions/26225513/how-to-test-os-exit-scenarios-in-go
func TestUnsetEnvironmentFatals(t *testing.T) {
	if os.Getenv("TEST_UNSET_ENV") == "1" {
		os.Setenv("ENVIRONMENT", "")
		config.GetEnvironment()
		return
	}
	cmd := exec.Command(os.Args[0], "-test.run=TestUnsetEnvironmentFatals")
	cmd.Env = append(os.Environ(), "TEST_UNSET_ENV=1")
	err := cmd.Run()
	if e, ok := err.(*exec.ExitError); ok && !e.Success() {
		return
	}
	t.Fatalf("process ran with err %v, want exit status 1", err)
}
