package main

import (
	"github.com/GeneralTask/task-manager/backend/api"
)

func main() {
	api.GetRouter(api.GetAPI()).Run()
}
