package main

import (
	"fmt"
	"github.com/GeneralTask/task-manager/backend/api"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/migrations"
	"log"
)

func main() {
	dbh, err := database.InitDB(nil)
	if err != nil {
		log.Fatalf("Failed to connect to db, %+v", err)
	}
	defer dbh.CloseConnection()

	err = migrations.RunMigrations("migrations")
	if err != nil {
		fmt.Printf("error running migrations: %v", err)
	}
	api.GetRouter(api.GetAPI()).Run()
}
