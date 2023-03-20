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

	var userID *primitive.ObjectID
	if userIDRaw, exists := c.Get("user"); exists {
		userIDValue := userIDRaw.(primitive.ObjectID)
		userID = &userIDValue
	}

	var note *database.Note
	if userID != nil {
		note, err = database.GetSharedNoteWithAuth(api.DB, noteID, *userID)
		if err != nil {
			notFoundRedirect(c, noteIDHex)
			return
		}
	} else {
		note, err = database.GetSharedNote(api.DB, noteID)
		if err != nil {
			notFoundRedirect(c, noteIDHex)
			return
		}
	}

	if note.SharedUntil < primitive.NewDateTimeFromTime(time.Now()) {
		notFoundRedirect(c, noteIDHex)
		return
	}

	previewTitle := "General Task Shared Note"
	if note.Title != nil && *note.SharedAccess == database.SharedAccessPublic {
		previewTitle = html.EscapeString(*note.Title)
	}

	previewAuthor := "Anonymous"
	if *note.SharedAccess == database.SharedAccessPublic {
		previewAuthor = html.EscapeString(note.Author)
	}

	noteURL := getNoteURL(note.ID.Hex())
	body := []byte(`
<!DOCTYPE html>
<html>
<head>
	<title>` + previewTitle + `</title>
	<meta http-equiv="Refresh" content="0; url='` + noteURL + `'" />

	<meta property="og:title" content="` + previewTitle + `" />
	<meta name="twitter:title" content="` + previewTitle + `">

	<meta content="Note shared by ` + previewAuthor + ` via General Task." property="og:description">
	<meta content="Note shared by ` + previewAuthor + ` via General Task." property="twitter:description">

	<meta property="og:type" content="website" />
	<meta property="og:url" content="` + config.GetConfigValue("SERVER_URL") + "note/" + note.ID.Hex() + `/" />
</head>
<body>
</body>
</html>`)
	c.Data(200, "text/html; charset=utf-8", body)
}

func notFoundRedirect(c *gin.Context, noteIDHex string) {
	noteURL := getNoteURL(noteIDHex)
	body := []byte(`
<!DOCTYPE html>
<html>
<head>
	<meta http-equiv="Refresh" content="0; url='` + noteURL + `'" />
</head>
<body>
</body>
</html>`)
	c.Data(200, "text/html; charset=utf-8", body)
}

func getNoteURL(noteIDHex string) string {
	return config.GetConfigValue("HOME_URL") + "note/" + noteIDHex
}
