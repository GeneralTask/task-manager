package api

import (
	"context"
	"sort"
	"time"

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
	AccountID      string               `json:"account_id"`
	Deeplink       string               `json:"deeplink"`
	Title          string               `json:"title"`
	Body           string               `json:"body"`
	CanModify      bool                 `json:"can_modify"`
	ConferenceCall utils.ConferenceCall `json:"conference_call"`
	DatetimeEnd    primitive.DateTime   `json:"datetime_end,omitempty"`
	DatetimeStart  primitive.DateTime   `json:"datetime_start,omitempty"`
	LinkedTaskID   string               `json:"linked_task_id"`
	Logo           string               `json:"logo"`
}

func (api *API) EventsList(c *gin.Context) {
	var eventListParams EventListParams
	err := c.BindQuery(&eventListParams)
	if err != nil {
		c.JSON(400, gin.H{"detail": "invalid or missing parameter."})
		return
	}

	externalAPITokenCollection := database.GetExternalTokenCollection(api.DB)
	userID := getUserIDFromContext(c)
	var userObject database.User
	userCollection := database.GetUserCollection(api.DB)
	err = userCollection.FindOne(context.Background(), bson.M{"_id": userID}).Decode(&userObject)

	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to find user")
		Handle500(c)
		return
	}

	var tokens []database.ExternalAPIToken
	cursor, err := externalAPITokenCollection.Find(
		context.Background(),
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
	err = cursor.All(context.Background(), &tokens)
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
			go taskSourceResult.Source.GetEvents(api.DB, userID, token.AccountID, *eventListParams.DatetimeStart, *eventListParams.DatetimeEnd, calendarEvents)
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
			taskSourceResult, _ := api.ExternalConfig.GetSourceResult(event.SourceID)
			logo := taskSourceResult.Details.LogoV2
			var linkedTaskID string
			if event.LinkedTaskID != primitive.NilObjectID {
				linkedTaskID = event.LinkedTaskID.Hex()
				if event.LinkedTaskSourceID != "" {
					taskSourceResult, _ = api.ExternalConfig.GetSourceResult(event.LinkedTaskSourceID)
					logo = taskSourceResult.Details.LogoV2
				} else {
					api.Logger.Error().Err(err).Msg("linked task source ID is empty")
				}
			}
			calendarEvents = append(calendarEvents, EventResult{
				ID:            event.ID,
				AccountID:     event.SourceAccountID,
				Deeplink:      event.Deeplink,
				Title:         event.Title,
				Body:          event.Body,
				CanModify:     event.CanModify,
				DatetimeEnd:   event.DatetimeEnd,
				DatetimeStart: event.DatetimeStart,
				ConferenceCall: utils.ConferenceCall{
					Logo:     event.CallLogo,
					Platform: event.CallPlatform,
					URL:      event.CallURL,
				},
				Logo:         logo,
				LinkedTaskID: linkedTaskID,
			})
		}
		err := api.adjustForCompletedEvents(userID, &calendarEvents, *eventListParams.DatetimeStart, *eventListParams.DatetimeEnd)
		if err != nil {
			api.Logger.Error().Err(err).Msg("failed to adjust for completed events")
			Handle500(c)
			return
		}
	}

	sort.SliceStable(calendarEvents, func(i, j int) bool {
		a := calendarEvents[i]
		b := calendarEvents[j]
		return a.DatetimeStart < b.DatetimeStart
	})

	c.JSON(200, calendarEvents)
}

func (api *API) adjustForCompletedEvents(userID primitive.ObjectID, calendarEvents *[]EventResult, datetimeStart time.Time, datetimeEnd time.Time) error {
	if calendarEvents == nil || len(*calendarEvents) == 0 {
		return nil
	}
	sourceAccountID := (*calendarEvents)[0].AccountID
	existingCalendarEvents, err := database.GetCalendarEvents(api.DB, userID, &[]bson.M{
		{"source_account_id": sourceAccountID},
		{"datetime_end": bson.M{"$gte": datetimeStart}},
		{"datetime_start": bson.M{"$lte": datetimeEnd}},
		{"linked_task_id": bson.M{"$exists": false}},
		{"linked_view_id": bson.M{"$exists": false}},
	})
	if err != nil {
		return err
	}

	fetchedCalendarIDs := make(map[primitive.ObjectID]bool)
	for _, calendarEvent := range *calendarEvents {
		fetchedCalendarIDs[calendarEvent.ID] = true
	}

	for _, existingCalendarEvent := range *existingCalendarEvents {
		if !fetchedCalendarIDs[existingCalendarEvent.ID] {
			_, err := database.GetCalendarEventCollection(api.DB).DeleteOne(context.Background(), bson.M{"_id": existingCalendarEvent.ID})
			if err != nil {
				api.Logger.Error().Err(err).Msg("failed to delete calendar event")
				return err
			}
		}
	}

	return nil
}
