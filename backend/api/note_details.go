package api

import (
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"time"
)

func (api *API) NoteDetails(c *gin.Context) {
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

	noteResult := api.noteToNoteResult(note, getUserIDFromContext(c))
	c.JSON(200, noteResult)
}
