package api

import (
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (api *API) NoteDetails(c *gin.Context) {
	log.Info().Msg("jerd1")
	noteIDHex := c.Param("note_id")
	noteID, err := primitive.ObjectIDFromHex(noteIDHex)
	if err != nil {
		// This means the note ID is improperly formatted
		Handle404(c)
		return
	}
	log.Info().Msg("jerd1")

	note, err := database.GetNoteWithoutAuthentication(api.DB, noteID)
	if err != nil {
		Handle404(c)
		return
	}
	log.Info().Msg("jerd1")
	if !note.IsShared {
		Handle404(c)
		return
	}

	log.Info().Msg("jerd1")
	noteResult := api.noteToNoteResult(note)
	c.JSON(200, noteResult)
}
