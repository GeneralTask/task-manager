package api

import (
	"context"
	"sort"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type EventListParams struct {
	DatetimeStart *time.Time `form:"datetime_start" binding:"required"`
	DatetimeEnd   *time.Time `form:"datetime_end" binding:"required"`
}

type EventResult struct {
	ID            primitive.ObjectID `json:"id"`
	Deeplink      string             `json:"deeplink"`
	Title         string             `json:"title"`
	Body          string             `json:"body"`
	DatetimeEnd   primitive.DateTime `json:"datetime_end,omitempty"`
	DatetimeStart primitive.DateTime `json:"datetime_start,omitempty"`
	CallLogo      string             `bson:"call_logo,omitempty"`
	CallPlatform  string             `bson:"call_platform,omitempty"`
	CallURL       string             `bson:"call_url,omitempty"`
}

func (api *API) EventsList(c *gin.Context) {
	parentCtx := c.Request.Context()

	var eventListParams EventListParams
	err := c.BindQuery(&eventListParams)
	if err != nil {
		c.JSON(400, gin.H{"detail": "invalid or missing parameter."})
		return
	}

	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()

	externalAPITokenCollection := database.GetExternalTokenCollection(db)
	userID, _ := c.Get("user")
	var userObject database.User
	userCollection := database.GetUserCollection(db)
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
			calendarEvents = append(calendarEvents, EventResult{
				ID:            event.ID,
				Deeplink:      event.Deeplink,
				Title:         event.Title,
				Body:          event.Body,
				DatetimeEnd:   event.DatetimeEnd,
				DatetimeStart: event.DatetimeStart,
				CallLogo:      event.CallLogo,
				CallPlatform:  event.CallPlatform,
				CallURL:       event.CallURL,
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
