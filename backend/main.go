package main

import (
	"github.com/GeneralTask/task-manager/backend/api"
	"github.com/GeneralTask/task-manager/backend/external"
)

func main() {
	api.GetRouter(&api.API{GoogleConfig: external.GetGoogleConfig(), SlackConfig: api.GetSlackConfig()}).Run()
}
