package api

import (
	"context"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type NoteResult struct {
	ID        primitive.ObjectID `json:"_id,omitempty"`
	Title     string             `json:"title,omitempty"`
	Body      string             `json:"body,omitempty"`
	Author    string             `json:"author,omitempty"`
	CreatedAt primitive.DateTime `json:"created_at,omitempty"`
	UpdatedAt primitive.DateTime `json:"updated_at,omitempty"`
	IsShared  bool               `json:"is_shared,omitempty"`
}

func (api *API) NotesList(c *gin.Context) {
	userID := getUserIDFromContext(c)
	var userObject database.User
	userCollection := database.GetUserCollection(api.DB)
	err := userCollection.FindOne(context.Background(), bson.M{"_id": userID}).Decode(&userObject)

	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to find user")
		Handle500(c)
		return
	}

	notes, err := database.GetNotes(api.DB, userID)
	if err != nil {
		Handle500(c)
		return
	}
	noteResults := api.noteListToNoteResultList(notes, userID)
	c.JSON(200, noteResults)
}

func (api *API) noteListToNoteResultList(notes *[]database.Note, userID primitive.ObjectID) []*NoteResult {
	noteResults := []*NoteResult{}
	for _, note := range *notes {
		result := api.noteToNoteResult(&note)
		noteResults = append(noteResults, result)
	}
	return noteResults
}

func (api *API) noteToNoteResult(note *database.Note) *NoteResult {
	return &NoteResult{
		ID:        note.ID,
		Title:     note.Title,
		Body:      note.Body,
		Author:    note.Author,
		CreatedAt: note.CreatedAt,
		UpdatedAt: note.UpdatedAt,
		IsShared:  note.IsShared,
	}
}
