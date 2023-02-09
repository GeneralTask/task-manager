package api

import (
	"html"
	"time"

	"github.com/GeneralTask/task-manager/backend/config"
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
	noteURL := config.GetConfigValue("HOME_URL") + "note/" + note.ID.Hex()
	body := `<html><head><title>` + previewTitle + `</title><meta http-equiv="Refresh" content="0; url='` + noteURL + `'" /></head><meta property="og:url" content="https://whitep4nth3r.com/blog/quick-light-dark-mode-css/" />
	<meta property="og:title" content="` + previewTitle + `" /><body></body></html>`
	c.String(200, body)
}
