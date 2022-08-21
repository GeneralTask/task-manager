package api

import (
	"context"
	"fmt"
	"sort"
	"time"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/GeneralTask/task-manager/backend/utils"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type EventListParams struct {
	DatetimeStart *time.Time `form:"datetime_start" binding:"required"`
	DatetimeEnd   *time.Time `form:"datetime_end" binding:"required"`
}

type EventResult struct {
	ID             primitive.ObjectID   `json:"id"`
	Deeplink       string               `json:"deeplink"`
	Title          string               `json:"title"`
	Body           string               `json:"body"`
	ConferenceCall utils.ConferenceCall `json:"conference_call"`
	DatetimeEnd    primitive.DateTime   `json:"datetime_end,omitempty"`
	DatetimeStart  primitive.DateTime   `json:"datetime_start,omitempty"`
	LinkedTaskID   string               `json:"linked_task_id"`
	LinkedTaskLink string               `json:"linked_task_link"`
	Logo           string               `json:"logo"`
}

func (api *API) EventsList(c *gin.Context) {
	parentCtx := c.Request.Context()

	var eventListParams EventListParams
	err := c.BindQuery(&eventListParams)
	if err != nil {
		c.JSON(400, gin.H{"detail": "invalid or missing parameter."})
		return
	}

	externalAPITokenCollection := database.GetExternalTokenCollection(api.DB)
	userID, _ := c.Get("user")
	var userObject database.User
	userCollection := database.GetUserCollection(api.DB)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = userCollection.FindOne(dbCtx, bson.M{"_id": userID}).Decode(&userObject)

	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to find user")
		Handle500(c)
		return
	}

	var tokens []database.ExternalAPIToken
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	cursor, err := externalAPITokenCollection.Find(
		dbCtx,
		bson.M{
			"$and": []bson.M{
				{"user_id": userID},
				{"is_bad_token": false},
			},
		},
	)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to fetch api tokens")
		Handle500(c)
		return
	}
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = cursor.All(dbCtx, &tokens)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to iterate through api tokens")
		Handle500(c)
		return
	}

	calendarEventChannels := []chan external.CalendarResult{}
	// Loop through linked accounts and fetch relevant items
	for _, token := range tokens {
		taskServiceResult, err := api.ExternalConfig.GetTaskServiceResult(token.ServiceID)
		if err != nil {
			api.Logger.Error().Err(err).Msg("error loading task service")
			continue
		}
		for _, taskSourceResult := range taskServiceResult.Sources {
			var calendarEvents = make(chan external.CalendarResult)
			go taskSourceResult.Source.GetEvents(userID.(primitive.ObjectID), token.AccountID, *eventListParams.DatetimeStart, *eventListParams.DatetimeEnd, calendarEvents)
			calendarEventChannels = append(calendarEventChannels, calendarEvents)
		}
	}

	calendarEvents := []EventResult{}
	for _, calendarEventChannel := range calendarEventChannels {
		calendarResult := <-calendarEventChannel
		if calendarResult.Error != nil {
			continue
		}
		for _, event := range calendarResult.CalendarEvents {
			linkedTaskLink := ""
			taskSourceResult, _ := api.ExternalConfig.GetSourceResult(event.SourceID)
			logo := taskSourceResult.Details.LogoV2
			if event.LinkedTaskID != primitive.NilObjectID {
				linkedTask, err := database.GetItem(dbCtx, event.LinkedTaskID, event.UserID)
				if err == nil {
					linkedTaskLink = getLinkedTaskLink(linkedTask)
					taskSourceResult, _ = api.ExternalConfig.GetSourceResult(linkedTask.SourceID)
					logo = taskSourceResult.Details.LogoV2
				}
			}
			calendarEvents = append(calendarEvents, EventResult{
				ID:            event.ID,
				Deeplink:      event.Deeplink,
				Title:         event.Title,
				Body:          event.Body,
				DatetimeEnd:   event.DatetimeEnd,
				DatetimeStart: event.DatetimeStart,
				ConferenceCall: utils.ConferenceCall{
					Logo:     event.CallLogo,
					Platform: event.CallPlatform,
					URL:      event.CallURL,
				},
				LinkedTaskLink: linkedTaskLink,
				Logo:           logo,
				LinkedTaskID:   event.LinkedTaskID.Hex(),
			})
		}
	}

	sort.SliceStable(calendarEvents, func(i, j int) bool {
		a := calendarEvents[i]
		b := calendarEvents[j]
		return a.DatetimeStart < b.DatetimeStart
	})

	c.JSON(200, calendarEvents)
}

func getLinkedTaskLink(linkedTask *database.Item) string {
	sectionID := linkedTask.IDTaskSection.Hex()
	if linkedTask.IsCompleted {
		sectionID = constants.IDTaskSectionDone.Hex()
	}
	return fmt.Sprintf("%stasks/%s/%s", config.GetConfigValue("HOME_URL"), sectionID, linkedTask.ID.Hex())
}
