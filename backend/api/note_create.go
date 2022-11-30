package api

import (
	"context"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"time"
)

type NoteCreateParams struct {
	UserID             primitive.ObjectID `json:"user_id"`
	Title              string             `json:"title" binding:"required"`
	Body               string             `json:"body"`
	AuthorDisplayEmail string             `json:"author_display_email"`
	IsShared           bool               `json:"is_shared"`
}

func (api *API) NoteCreate(c *gin.Context) {
	var noteCreateParams NoteCreateParams
	err := c.BindJSON(&noteCreateParams)
	if err != nil {
		c.JSON(400, gin.H{"detail": "invalid or missing parameter"})
		return
	}
	userID := getUserIDFromContext(c)

	newNote := database.Note{
		UserID:             userID,
		Title:              &noteCreateParams.Title,
		Body:               &noteCreateParams.Body,
		AuthorDisplayEmail: noteCreateParams.AuthorDisplayEmail,
		CreatedAt:          primitive.NewDateTimeFromTime(time.Now()),
		UpdatedAt:          primitive.NewDateTimeFromTime(time.Now()),
		IsShared:           &noteCreateParams.IsShared,
	}
	insertResult, err := database.GetNoteCollection(api.DB).InsertOne(context.Background(), newNote)
	if err != nil {
		c.JSON(503, gin.H{"detail": "failed to create note"})
		return
	}

	c.JSON(200, gin.H{"note_id": insertResult.InsertedID.(primitive.ObjectID)})
}
