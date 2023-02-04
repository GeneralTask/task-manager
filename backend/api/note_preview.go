package api

import (
	"html"
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (api *API) NotePreview(c *gin.Context) {
	noteIDHex := c.Param("note_id")
	noteID, err := primitive.ObjectIDFromHex(noteIDHex)
	if err != nil {
		// This means the note ID is improperly formatted
		Handle404(c)
		return
	}

	note, err := database.GetSharedNote(api.DB, noteID)
	if err != nil {
		Handle404(c)
		return
	}
	if note.SharedUntil < primitive.NewDateTimeFromTime(time.Now()) {
		Handle404(c)
		return
	}

	previewTitle := ""
	if note.Title != nil {
		previewTitle = html.EscapeString(*note.Title)
	}
	body := "<html><head><title>" + previewTitle + "</title></head><body></body></html>"
	c.String(200, body)
}
