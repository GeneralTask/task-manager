package api

import (
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
)

type EventModifyParams struct {
	database.CalendarEventChangeableFields
}

func (api *API) EventModify(c *gin.Context) {
	// eventID := c.Param("event_id")
	var modifyParams EventModifyParams
	err := c.BindJSON(&modifyParams)
	if err != nil {
		c.JSON(400, gin.H{"detail": "parameter missing or malformatted"})
		return
	}

	// userIDRaw, _ := c.Get("user")
	// userID := userIDRaw.(primitive.ObjectID)

	// // get event from DB
	// parentCtx := c.Request.Context()
	// db, dbCleanup, err := database.GetDBConnection()
	// logger := logging.GetSentryLogger()
	// if err != nil {
	// 	logger.Error().Err(err).Msg("Failed to establish DB connection")
	// 	return nil, err
	// }
	// defer dbCleanup()
	// taskCollection := GetTaskCollection(db)

}
