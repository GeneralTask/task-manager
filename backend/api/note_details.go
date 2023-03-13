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

	note, err := database.GetSharedNote(api.DB, noteID)
	if err != nil {
		Handle404(c)
		return
	}
	if note.SharedUntil < primitive.NewDateTimeFromTime(time.Now()) {
		Handle404(c)
		return
	}

	noteResult := api.noteToNoteResult(note)
	c.JSON(200, noteResult)
}

func (api *API) NoteDetailsAuthed(c *gin.Context) {
	noteIDHex := c.Param("note_id")
	noteID, err := primitive.ObjectIDFromHex(noteIDHex)
	if err != nil {
		// This means the note ID is improperly formatted
		Handle404(c)
		return
	}

	userID := getUserIDFromContext(c)

	note, err := database.GetSharedNoteWithAuth(api.DB, noteID, userID)
	if err != nil {
		Handle404(c)
		return
	}
	if note.SharedUntil < primitive.NewDateTimeFromTime(time.Now()) {
		Handle404(c)
		return
	}

	noteResult := api.noteToNoteResult(note)
	c.JSON(200, noteResult)
}
