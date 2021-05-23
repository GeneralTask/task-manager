package main

import (
	"github.com/GeneralTask/task-manager/backend/api"
)

func main() {
	api.GetRouter(&api.API{GoogleConfig: api.GetGoogleConfig(), SlackConfig: api.GetSlackConfig()}).Run()
}
