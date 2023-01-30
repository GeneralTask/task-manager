package api

import (
	"context"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

type CalendarResult struct {
	CalendarID string `json:"calendar_id,omitempty"`
	ColorID    string `json:"color_id,omitempty"`
	Title      string `json:"title,omitempty"`
}

type CalendarAccountResult struct {
	AccountID        string           `json:"account_id"`
	Calendars        []CalendarResult `json:"calendars"`
	HasMulticalScope bool             `json:"has_multical_scopes"`
}

func (api *API) CalendarsList(c *gin.Context) {
	userID := getUserIDFromContext(c)
	var userObject database.User
	userCollection := database.GetUserCollection(api.DB)
	err := userCollection.FindOne(context.Background(), bson.M{"_id": userID}).Decode(&userObject)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to find user")
		Handle500(c)
		return
	}

	calendarAccounts, err := database.GetCalendarAccounts(api.DB, userID)
	if err != nil {
		Handle500(c)
		return
	}
	results := []*CalendarAccountResult{}
	for _, account := range *calendarAccounts {
		// for implicit memory aliasing
		calendars := []CalendarResult{}
		for _, calendar := range account.Calendars {
			calendarResult := CalendarResult{
				CalendarID: calendar.CalendarID,
				ColorID:    calendar.ColorID,
				Title:      calendar.Title,
			}
			calendars = append(calendars, calendarResult)

		}
		result := CalendarAccountResult{
			AccountID:        account.IDExternal,
			Calendars:        calendars,
			HasMulticalScope: database.HasUserGrantedMultiCalendarScope(account.Scopes),
		}
		results = append(results, &result)
	}

	c.JSON(200, results)
}
