package api

import (
	"bytes"
	"encoding/json"
	"io/ioutil"

	"github.com/gin-gonic/gin"
)

type LinearWebhookPayload struct {
	Action    string           `json:"action"`
	Type      string           `json:"type"`
	CreatedAt string           `json:"createdAt"`
	RawData   *json.RawMessage `json:"data"`
}

type LinearIssue struct {
	ID          string      `json:"id"`
	Title       string      `json:"title"`
	Description string      `json:"description"`
	Priority    int         `json:"priority"`
	AssigneeID  string      `json:"assigneeId"`
	State       LinearState `json:"state"`
	Team        LinearTeam  `json:"team"`
	CreatedAt   string      `json:"createdAt"`
	UpdatedAt   string      `json:"updatedAt"`
}

type LinearState struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Type string `json:"type"`
}

type LinearTeam struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type LinearCommentPayload struct {
	ID        string `json:"id"`
	Body      string `json:"body"`
	IssueID   string `json:"issueId"`
	UserID    string `json:"userId"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
}

func (api *API) LinearWebhook(c *gin.Context) {
	// make request body readable
	body, _ := ioutil.ReadAll(c.Request.Body)
	// this is required, as the first write fully consumes the body
	// the Form in the body is required for payload extraction
	c.Request.Body = ioutil.NopCloser(bytes.NewBuffer(body))

	// unmarshal into request params for type and trigger id
	var webhookPayload LinearWebhookPayload
	err := json.Unmarshal(body, &webhookPayload)
	if err != nil {
		c.JSON(400, gin.H{"detail": "unable to process linear webhook payload"})
		return
	}

	// switch p.Type {
	// 	case "string":
	// 		p.value = ""
	// 	case "struct":
	// 		p.value = &Something{}
	// 	}

	// 	if err := json.Unmarshal([]byte(*rawValue), &p.value); err != nil {
	// 		return nil, err
	// 	}
	// }

	c.JSON(501, gin.H{"detail": "method not recognized"})
}
