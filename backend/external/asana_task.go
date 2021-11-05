package external

import (
	"errors"
	"log"

	"github.com/GeneralTask/task-manager/backend/database"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type AsanaTaskSource struct {
	Asana AsanaService
}

func (AsanaTask AsanaTaskSource) GetEmails(userID primitive.ObjectID, accountID string, result chan<- EmailResult) {
	result <- emptyEmailResult(nil)
}

func (AsanaTask AsanaTaskSource) GetEvents(userID primitive.ObjectID, accountID string, timezoneOffsetMinutes int, result chan<- CalendarResult) {
	result <- emptyCalendarResult(nil)
}

func (AsanaTask AsanaTaskSource) GetTasks(userID primitive.ObjectID, accountID string, result chan<- TaskResult) {
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		result <- emptyTaskResult(err)
		return
	}
	defer dbCleanup()

	client := getAsanaHttpClient(db, userID, accountID)
	log.Println("client:", client)

	userInfoURL := "https://app.asana.com/api/1.0/users/me"
	if AsanaTask.Asana.ConfigValues.UserInfoURL != nil {
		userInfoURL = *AsanaTask.Asana.ConfigValues.UserInfoURL
	}

	response, err := client.Get(userInfoURL)
	if err != nil {
		log.Printf("failed to load asana user info: %v", err)
	}
	log.Println("response:", response)
	result <- emptyTaskResult(nil)
	// first, get new token using oauth client (see how google does it)
	// then, get workspace ID: https://app.asana.com/api/1.0/users/me
	/*
		{
			"data": {
				"gid": "1199950905836463",
				"email": "john@generaltask.io",
				"name": "John Reinstra",
				"photo": null,
				"resource_type": "user",
				"workspaces": [
					{
						"gid": "1199951001109677",
						"name": "generaltask.io",
						"resource_type": "workspace"
					}
				]
			}
		}
	*/
	// sample URL to fetch active tasks for a user:
	// https://app.asana.com/api/1.0/tasks/?assignee=me&workspace=1199951001109677&completed_since=2022-01-01&opt_fields=this.html_notes,this.name,this.due_at,this.due_on
	/*
		{
			"data": [
				{
					"gid": "1201012333089937",
					"due_at": "2021-11-08T18:00:00.000Z",
					"due_on": "2021-11-08",
					"html_notes": "<body></body>",
					"name": "Asana integration"
				},
			]
		}
	*/
	result <- emptyTaskResult(errors.New("missing authToken or siteConfiguration"))
}

func (AsanaTask AsanaTaskSource) MarkAsDone(userID primitive.ObjectID, accountID string, issueID string) error {
	// sample URL: https://app.asana.com/api/1.0/tasks/1201012333089937/
	// PUT payload: {"data": {"completed": true}}
	return errors.New("missing token or siteConfiguration")
}

func (AsanaTask AsanaTaskSource) Reply(userID primitive.ObjectID, accountID string, taskID primitive.ObjectID, body string) error {
	return errors.New("cannot reply to an asana task")
}

func (AsanaTask AsanaTaskSource) CreateNewTask(userID primitive.ObjectID, accountID string, task TaskCreationObject) error {
	return errors.New("cannot create new asana task")
}
