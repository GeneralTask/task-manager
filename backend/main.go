package main

import (
	"github.com/GeneralTask/task-manager/backend/api"
	"github.com/GeneralTask/task-manager/backend/external"
)

func main() {
	api.GetRouter(&api.API{ExternalConfig: external.GetConfig()}).Run()
}
