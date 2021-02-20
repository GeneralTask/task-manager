package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	guuid "github.com/google/uuid"
	"golang.org/x/oauth2"
	"google.golang.org/api/calendar/v3"
	"google.golang.org/api/gmail/v1"
)



func (api *API) tasksList(c *gin.Context) {
	var (
		googleToken ExternalAPIToken
		token oauth2.Token
	)
	api.getExternalAPITokenFromCtx(c, &googleToken)
	json.Unmarshal([]byte(googleToken.Token), &token)

	var tasks []*Task

	config := api.GoogleConfig
	client := config.Client(context.Background(), &token).(*http.Client)

	gmailService, err := gmail.New(client)
	if err != nil {
		log.Fatalf("Unable to create Gmail service: %v", err)
	}
	threadsResponse, err := gmailService.Users.Threads.List("me").Q("is:unread").Do()
	if err != nil {
		log.Fatalf("Failed to load Gmail threads for user: %v", err)
	}
	for _, threadListItem := range threadsResponse.Threads {
		thread, err := gmailService.Users.Threads.Get("me", threadListItem.Id).Do()
		if err != nil {
			log.Fatalf("failed to load thread! %v", err)
		}
		var sender = ""
		var title = ""
		for _, header := range thread.Messages[0].Payload.Headers {
			if header.Name == "From" {
				sender = header.Value
			}
			if header.Name == "Subject" {
				title = header.Value
			}
		}
		tasks = append(tasks, &Task{
			ID:         guuid.New().String(),
			IDExternal: threadListItem.Id,
			IDOrdering: len(tasks),
			Sender:     sender,
			Source:     "gmail",
			Title:      title,
		})
	}

	calendarService, err := calendar.New(client)
	if err != nil {
		log.Fatalf("Unable to create Calendar service: %v", err)
	}
	calendarResponse, err := calendarService.Events.List("primary").Do()
	if err != nil {
		log.Fatalf("Unable to load calendar events: %v", err)
	}
	for _, event := range calendarResponse.Items {
		tasks = append(tasks, &Task{
			ID:            guuid.New().String(),
			IDExternal:    event.Id,
			IDOrdering:    len(tasks),
			DatetimeEnd:   event.End.DateTime,
			DatetimeStart: event.Start.DateTime,
			Source:        "gcal",
			Title:         event.Summary,
		})
	}
	c.JSON(200, tasks)
}

func getRouter(api *API) *gin.Engine {
	router := gin.Default()
	// Unauthenticated endpoints
	router.GET("/login/", api.login)
	router.GET("/login/callback/", api.loginCallback)
	router.Use(tokenMiddleware)
	// Authenticated endpoints
	router.GET("/tasks/", api.tasksList)
	return router
}

func main() {
	var apiConfig APIConfig
	if err := parseAPIConfig(&apiConfig); err != nil {
		log.Fatalf("Could not parse configuration! %v", err)
	}

	getRouter(&API{GoogleConfig: getGoogleConfig(), InternalConfig: apiConfig}).Run()
}
