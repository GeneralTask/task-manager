package main

import (
	"fmt"

	"github.com/GeneralTask/task-manager/backend/api"
	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/mongodb"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func main() {
	err := runMigrations()
	if err != nil {
		fmt.Printf("error running migrations: %v", err)
		return
	}
	api.GetRouter(api.GetAPI()).Run()
}

func runMigrations() error {
	fullDBURL := fmt.Sprintf("%s/%s?authSource=admin", config.GetConfigValue("MONGO_URI"), config.GetConfigValue("DB_NAME"))
	m, err := migrate.New("file://migrations", fullDBURL)
	if err != nil {
		return err
	}
	err = m.Up()
	if err.Error() == "no change" {
		// we'll consider no change to be a successful migration run
		return nil
	}
	return err
}
