package api

import (
	"context"
	"fmt"
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type NoteCreateParams struct {
	Title         string                 `json:"title" binding:"required"`
	Body          string                 `json:"body"`
	Author        string                 `json:"author"`
	SharedUntil   primitive.DateTime     `json:"shared_until"`
	SharedAccess  *database.SharedAccess `json:"shared_access,omitempty"`
	LinkedEventID primitive.ObjectID     `json:"linked_event_id,omitempty"`
}

func (api *API) NoteCreate(c *gin.Context) {
	var noteCreateParams NoteCreateParams
	err := c.BindJSON(&noteCreateParams)
	if err != nil {
		c.JSON(400, gin.H{"detail": "invalid or missing parameter"})
		return
	}
	userID := getUserIDFromContext(c)

	if noteCreateParams.LinkedEventID != primitive.NilObjectID {
		// check that the event exists
		_, err = database.GetCalendarEvent(api.DB, noteCreateParams.LinkedEventID, userID)
		if err != nil {
			api.Logger.Error().Err(err).Msgf("linked event not found: %s, err", noteCreateParams.LinkedEventID.Hex())
			c.JSON(400, gin.H{"detail": fmt.Sprintf("linked event not found: %s", noteCreateParams.LinkedEventID.Hex())})
			return
		}
	}

	sharedAccessValid := database.CheckNoteSharingAccessValid(noteCreateParams.SharedAccess)
	if !sharedAccessValid {
		api.Logger.Error().Err(err).Msg("invalid shared access token")
		c.JSON(400, gin.H{"detail": "invalid shared access token"})
		return
	}

	newNote := database.Note{
		UserID:        userID,
		Title:         &noteCreateParams.Title,
		Body:          &noteCreateParams.Body,
		Author:        noteCreateParams.Author,
		CreatedAt:     primitive.NewDateTimeFromTime(time.Now()),
		UpdatedAt:     primitive.NewDateTimeFromTime(time.Now()),
		SharedUntil:   noteCreateParams.SharedUntil,
		SharedAccess:  noteCreateParams.SharedAccess,
		LinkedEventID: noteCreateParams.LinkedEventID,
	}
	insertResult, err := database.GetNoteCollection(api.DB).InsertOne(context.Background(), newNote)
	if err != nil {
		c.JSON(503, gin.H{"detail": "failed to create note"})
		return
	}

	c.JSON(200, gin.H{"note_id": insertResult.InsertedID.(primitive.ObjectID)})
}
