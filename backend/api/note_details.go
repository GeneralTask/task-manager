package api

import (
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (api *API) NoteDetails(c *gin.Context) {
	noteIDHex := c.Param("note_id")
	noteID, err := primitive.ObjectIDFromHex(noteIDHex)
	if err != nil {
		// This means the note ID is improperly formatted
		Handle404(c)
		return
	}

	var userID *primitive.ObjectID
	if userIDRaw, exists := c.Get("user"); exists {
		userIDValue := userIDRaw.(primitive.ObjectID)
		userID = &userIDValue
	}

	var note *database.Note
	if userID != nil {
		note, err = database.GetSharedNoteWithAuth(api.DB, noteID, *userID)
		if err != nil {
			Handle404(c)
			return
		}
	} else {
		note, err = database.GetSharedNote(api.DB, noteID)
		if err != nil {
			Handle404(c)
			return
		}
	}

	if note.SharedUntil < primitive.NewDateTimeFromTime(time.Now()) {
		Handle404(c)
		return
	}

	noteResult := api.noteToNoteResult(note)
	c.JSON(200, noteResult)
}
