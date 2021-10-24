package main

import (
	"fmt"

	"github.com/GeneralTask/task-manager/backend/api"
	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/source/file"
)

func main() {
	f := file.File{}
	fmt.Println(f)
	m, err := migrate.New("file://migrations", config.GetConfigValue("MONGO_URI"))
	if err != nil {
		fmt.Printf("error setting up migrations: %v", err)
		return
	}
	err = m.Up()
	if err != nil {
		fmt.Printf("error running migrations: %v", err)
		return
	}
	api.GetRouter(api.GetAPI()).Run()
}
