package api

import (
	"fmt"
	"net/http"
	"testing"
)

func TestEventModify(t *testing.T) {
	// parentCtx := context.Background()
	// db, dbCleanup, err := database.GetDBConnection()
	// assert.NoError(t, err)
	// defer dbCleanup()

	// authToken := login("approved@generaltask.com", "")
	// userID := getUserIDFromAuthToken(t, db, authToken)

	// taskCollection := database.GetTaskCollection(db)

	// dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	// defer cancel()
	// authtoken := login("test_overview@generaltask.com", "")
	// api := GetAPI()
	// router := GetRouter(api)

	eventID := "duck"
	t.Run("Unauthorized", func(t *testing.T) {
		url := fmt.Sprintf("/overview/views/%s/", eventID)
		ServeRequest(t, "badAuthToken", "DELETE", url, nil, http.StatusUnauthorized)
	})

}
