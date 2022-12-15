package testutils

import (
	"github.com/gin-gonic/gin"
	"google.golang.org/api/calendar/v3"
	"google.golang.org/api/googleapi"
	"net/http/httptest"
)

func GetGcalFetchServer(events []*calendar.Event) *httptest.Server {
	return httptest.NewServer(func() *gin.Engine {
		w := httptest.NewRecorder()
		_, r := gin.CreateTestContext(w)

		r.GET("/calendars/:calendarId/events", func(c *gin.Context) {
			response := &calendar.Events{
				Items:          events,
				ServerResponse: googleapi.ServerResponse{HTTPStatusCode: 200},
			}
			c.JSON(200, response)
		})
		r.GET("/users/me/calendarList", func(c *gin.Context) {
			response := &calendar.CalendarList{
				Items: []*calendar.CalendarListEntry{
					{ColorId: "1", Id: "primary"},
					{ColorId: "2", Id: "testuser@gmail.com"},
				},
				ServerResponse: googleapi.ServerResponse{HTTPStatusCode: 200},
			}
			c.JSON(200, response)
		})

		return r
	}())
}
