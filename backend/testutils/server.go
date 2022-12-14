package testutils

import (
	"encoding/json"
	"github.com/gin-gonic/gin"
	"google.golang.org/api/calendar/v3"
	"google.golang.org/api/googleapi"
	"net/http"
	"net/http/httptest"
)

func GetServerForEvents(events []*calendar.Event) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		resp := &calendar.Events{
			Items:          events,
			ServerResponse: googleapi.ServerResponse{HTTPStatusCode: 200},
		}

		b, err := json.Marshal(resp)
		if err != nil {
			http.Error(w, "unable to marshal request: "+err.Error(), http.StatusBadRequest)
			return
		}
		w.Write(b)
	}))
}

//func GetGcalFetchServer(t *testing.T, threadsMap map[string]*gmail.Thread, messages []*gmail.Message) *httptest.Server {
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

		////r.Any("/*proxyPath", func(c *gin.Context) {
		//r.NoRoute(func(c *gin.Context) {
		//	//threads := make([]*gmail.Thread, 0, len(threadsMap))
		//	//for _, value := range threadsMap {
		//	//	threads = append(threads, value)
		//	//}
		//	//response := &gmail.ListThreadsResponse{Threads: threads}
		//	//c.JSON(200, response)
		//	log.Error().Msgf("jerddy %s", c.Request.RequestURI)
		//	log.Error().Msgf("jerddy %s", c.Request.URL)
		//	response := &calendar.Events{
		//		Items:          events,
		//		ServerResponse: googleapi.ServerResponse{HTTPStatusCode: 200},
		//	}
		//	c.JSON(200, response)
		//})

		return r
	}())
}
