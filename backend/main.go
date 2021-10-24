package main

import (
	"github.com/GeneralTask/task-manager/backend/api"
	"github.com/golang-migrate/migrate/v4"
)

func main() {
	m, err := migrate.New("", "")
	api.GetRouter(api.GetAPI()).Run()
}
