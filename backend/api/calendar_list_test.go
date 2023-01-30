package api

import (
	"encoding/json"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"net/http"
	"testing"
)

func TestCalendarList(t *testing.T) {
	authToken := login("test_notes_list@generaltask.com", "")
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := getUserIDFromAuthToken(t, db, authToken)
	notUserID := primitive.NewObjectID()
	_, err = database.UpdateOrCreateCalendarAccount(
		db,
		userID,
		"123abc",
		"foobar_source",
		&database.CalendarAccount{
			UserID:     userID,
			IDExternal: "account1",
			Calendars: []database.Calendar{
				{
					CalendarID: "cal1",
					ColorID:    "col1",
					Title:      "title1",
					AccessRole: "owner",
				},
			},
		},
		nil,
	)
	assert.NoError(t, err)
	_, err = database.UpdateOrCreateCalendarAccount(
		db,
		userID,
		"123def",
		"foobar_source",
		&database.CalendarAccount{
			UserID:     userID,
			IDExternal: "account2",
			Calendars: []database.Calendar{
				{
					CalendarID: "cal2",
					ColorID:    "col2",
					Title:      "title2",
					AccessRole: "reader",
				},
				{
					CalendarID: "cal3",
					ColorID:    "col3",
					Title:      "title3",
					AccessRole: "writer",
				},
			},
			Scopes: []string{"https://www.googleapis.com/auth/calendar"},
		},
		nil,
	)
	assert.NoError(t, err)
	_, err = database.UpdateOrCreateCalendarAccount(
		db,
		userID,
		"123abc",
		"foobar_source",
		&database.CalendarAccount{
			UserID:     notUserID,
			IDExternal: "account3",
			Calendars: []database.Calendar{
				{
					CalendarID: "cal4",
					ColorID:    "col4",
					Title:      "title4",
				},
			},
		},
		nil,
	)
	assert.NoError(t, err)

	UnauthorizedTest(t, "GET", "/calendars/", nil)
	t.Run("Success", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()

		response := ServeRequest(t, authToken, "GET", "/calendars/?", nil, http.StatusOK, api)
		var result []CalendarAccountResult
		err = json.Unmarshal(response, &result)

		assert.NoError(t, err)
		assert.Equal(t, 2, len(result))

		assert.Equal(t, []CalendarAccountResult{
			{AccountID: "account1", Calendars: []CalendarResult{{CalendarID: "cal1", ColorID: "col1", Title: "title1", CanWrite: true}}, HasMulticalScope: false},
			{AccountID: "account2", Calendars: []CalendarResult{{CalendarID: "cal2", ColorID: "col2", Title: "title2", CanWrite: false}, {CalendarID: "cal3", ColorID: "col3", Title: "title3", CanWrite: true}}, HasMulticalScope: true},
		},
			result)
	})
}
