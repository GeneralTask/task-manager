package main

import (
	"fmt"

	"github.com/GeneralTask/task-manager/backend/api"
	"github.com/GeneralTask/task-manager/backend/migrations"
)

func main() {
	err := migrations.RunMigrations("migrations")
	if err != nil {
		fmt.Printf("error running migrations: %v", err)
	}
	api.GetRouter(api.GetAPI()).Run()
}
