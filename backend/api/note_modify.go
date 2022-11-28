package api

import (
	"context"
	"errors"
	"github.com/GeneralTask/task-manager/backend/database"
	"time"

	"github.com/rs/zerolog/log"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type NoteChangeable struct {
	Title    string `json:"title,omitempty"`
	Body     string `json:"body,omitempty"`
	Author   string `json:"author,omitempty"`
	IsShared *bool  `json:"is_shared,omitempty"`
}

type NoteModifyParams struct {
	NoteChangeable
}

func (api *API) NoteModify(c *gin.Context) {
	noteIDHex := c.Param("note_id")
	noteID, err := primitive.ObjectIDFromHex(noteIDHex)
	if err != nil {
		// This means the note ID is improperly formatted
		Handle404(c)
		return
	}
	var modifyParams NoteModifyParams
	err = c.BindJSON(&modifyParams)
	if err != nil {
		c.JSON(400, gin.H{"detail": "parameter missing or malformatted"})
		return
	}

	userIDRaw, _ := c.Get("user")
	userID := userIDRaw.(primitive.ObjectID)

	note, err := database.GetNote(api.DB, noteID, userID)
	if err != nil {
		c.JSON(404, gin.H{"detail": "note not found.", "noteId": noteID})
		return
	}

	// check if all fields are empty
	if modifyParams == (NoteModifyParams{}) {
		c.JSON(400, gin.H{"detail": "note changes missing"})
		return
	}

	if modifyParams.NoteChangeable != (NoteChangeable{}) {
		isShared := note.IsShared
		if modifyParams.NoteChangeable.IsShared != nil {
			isShared = modifyParams.NoteChangeable.IsShared
		}
		updatedNote := database.Note{
			Title:     modifyParams.NoteChangeable.Title,
			Body:      modifyParams.NoteChangeable.Body,
			Author:    modifyParams.NoteChangeable.Author,
			IsShared:  isShared,
			UpdatedAt: primitive.NewDateTimeFromTime(time.Now()),
		}

		api.UpdateNoteInDB(c, note, userID, &updatedNote)
	}

	c.JSON(200, gin.H{})
}

func (api *API) UpdateNoteInDB(c *gin.Context, note *database.Note, userID primitive.ObjectID, updateFields *database.Note) {
	err := api.UpdateNoteInDBWithError(note, userID, updateFields)
	if err != nil {
		Handle500(c)
		return
	}
}

func (api *API) UpdateNoteInDBWithError(note *database.Note, userID primitive.ObjectID, updateFields *database.Note) error {
	noteCollection := database.GetNoteCollection(api.DB)

	res, err := noteCollection.UpdateOne(
		context.Background(),
		bson.M{"$and": []bson.M{
			{"_id": note.ID},
			{"user_id": userID},
		}},
		bson.M{"$set": updateFields},
	)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to update internal DB")
		return err
	}
	if res.MatchedCount != 1 {
		log.Print("failed to update note", res)
		return errors.New("failed to update note")
	}

	return nil
}
