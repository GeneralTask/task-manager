package api

import (
	"bytes"
	"encoding/json"
	"errors"
	"io/ioutil"
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/GeneralTask/task-manager/backend/logging"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const IssueType = "Issue"
const CommentType = "Comment"
const CreateAction = "create"
const UpdateAction = "update"
const RemoveAction = "remove"
const ValidLinearIP1 = "35.231.147.226"
const ValidLinearIP2 = "35.243.134.228"

type LinearWebhookPayload struct {
	Action      string           `json:"action"`
	Type        string           `json:"type"`
	CreatedAt   string           `json:"createdAt"`
	RawData     *json.RawMessage `json:"data"`
	UpdatedFrom *json.RawMessage `json:"updatedFrom"`
}

type LinearIssuePayload struct {
	ID          string      `json:"id,omitempty"`
	Title       string      `json:"title,omitempty"`
	Description string      `json:"description,omitempty"`
	Priority    int         `json:"priority,omitempty"`
	AssigneeID  string      `json:"assigneeId,omitempty"`
	State       LinearState `json:"state,omitempty"`
	Team        LinearTeam  `json:"team,omitempty"`
	DueDate     string      `json:"dueDate,omitempty"`
	CreatedAt   string      `json:"createdAt,omitempty"`
	UpdatedAt   string      `json:"updatedAt,omitempty"`
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
	ID        string `json:"id,omitempty"`
	Body      string `json:"body,omitempty"`
	IssueID   string `json:"issueId,omitempty"`
	UserID    string `json:"userId,omitempty"`
	CreatedAt string `json:"createdAt,omitempty"`
	UpdatedAt string `json:"updatedAt,omitempty"`
}

func (api *API) LinearWebhook(c *gin.Context) {
	requestIP := c.Request.Header.Get("X-Forwarded-For")
	if requestIP != ValidLinearIP1 && requestIP != ValidLinearIP2 {
		c.JSON(400, gin.H{"detail": "invalid request format"})
		return
	}

	// make request body readable
	body, err := ioutil.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(400, gin.H{"detail": "unable to read request body"})
		return
	}
	// this is required, as the first write fully consumes the body
	// the Form in the body is required for payload extraction
	c.Request.Body = ioutil.NopCloser(bytes.NewBuffer(body))

	// unmarshal into request params for type and trigger id
	var webhookPayload LinearWebhookPayload
	err = json.Unmarshal(body, &webhookPayload)
	if err != nil {
		c.JSON(400, gin.H{"detail": "unable to process linear webhook payload"})
		return
	}

	switch webhookPayload.Type {
	case CommentType:
		var commentPayload LinearCommentPayload
		if err := json.Unmarshal([]byte(*webhookPayload.RawData), &commentPayload); err != nil {
			api.Logger.Error().Err(err).Msg("failed to unmarshal linear comment object")
			c.JSON(400, gin.H{"detail": "unable to unmarshal linear issue object"})
			return
		}
		err = api.processLinearCommentWebhook(c, webhookPayload, commentPayload)
		if err != nil {
			c.JSON(400, gin.H{"detail": "unable to process Linear comment webhook"})
			return
		}
	default:
		api.Logger.Error().Err(err).Msg("unrecognized linear payload format")
		c.JSON(400, gin.H{"detail": "unrecognized linear payload format"})
		return
	}

	c.JSON(200, gin.H{})
}

func (api *API) processLinearCommentWebhook(c *gin.Context, webhookPayload LinearWebhookPayload, commentPayload LinearCommentPayload) error {
	var err error
	logger := logging.GetSentryLogger()
	task, err := database.GetTaskByExternalIDWithoutUser(api.DB, commentPayload.IssueID)
	if err != nil {
		logger.Error().Err(err).Msg("could not find matching linear task")
		return err
	}

	token, err := database.GetExternalToken(api.DB, task.SourceAccountID, external.TASK_SERVICE_ID_LINEAR)
	if err != nil {
		logger.Error().Err(err).Msg("could not find matching external ID")
		return err
	}

	userIDExternal := commentPayload.UserID
	userID := token.UserID
	accountID := token.AccountID

	switch webhookPayload.Action {
	case CreateAction:
		err = api.createCommentFromPayload(c, userID, userIDExternal, accountID, commentPayload, task)
	case UpdateAction:
		err = api.modifyCommentFromPayload(c, userID, commentPayload, task)
	case RemoveAction:
		err = api.removeCommentFromPayload(c, userID, commentPayload, task)
	default:
		err = errors.New("action type not recognized")
		logger.Error().Err(err).Msg("invalid action type")
	}
	return err
}

func (api *API) createCommentFromPayload(c *gin.Context, userID primitive.ObjectID, externalUserID string, accountID string, commentPayload LinearCommentPayload, task *database.Task) error {
	// if comment already present, most likely comment was created by GT modify endpoint
	// if so, we don't add to DB because would be duplicate
	shouldAddComment := true
	comments := task.Comments
	if comments != nil {
		for _, comment := range *comments {
			if comment.ExternalID == commentPayload.ID {
				shouldAddComment = false
			}
		}
	}

	if !shouldAddComment {
		return nil
	}

	userStruct, err := api.getLinearUserInfo(userID, accountID, externalUserID)
	if err != nil {
		logger := logging.GetSentryLogger()
		logger.Error().Err(err).Msg("could not fetch linear user struct")
		return err
	}

	var commentsNew []database.Comment
	commentCreatedAt, _ := time.Parse("2006-01-02T15:04:05.000Z", string(commentPayload.CreatedAt))

	commentToAdd := database.Comment{
		ExternalID: commentPayload.ID,
		Body:       commentPayload.Body,
		User: database.ExternalUser{
			ExternalID:  commentPayload.UserID,
			Name:        string(userStruct.User.Name),
			DisplayName: string(userStruct.User.DisplayName),
			Email:       string(userStruct.User.Email),
		},
		CreatedAt: primitive.NewDateTimeFromTime(commentCreatedAt),
	}

	if comments != nil {
		commentsNew = append(*comments, commentToAdd)
	} else {
		commentsNew = []database.Comment{commentToAdd}
	}

	return api.updateComments(task, userID, commentsNew)
}

func (api *API) modifyCommentFromPayload(c *gin.Context, userID primitive.ObjectID, commentPayload LinearCommentPayload, task *database.Task) error {
	comments := task.Comments
	var commentsNew []database.Comment
	for _, comment := range *comments {
		// only accept body changes for modification
		if comment.ExternalID == commentPayload.ID {
			comment.Body = commentPayload.Body
		}
		commentsNew = append(commentsNew, comment)
	}

	return api.updateComments(task, userID, commentsNew)
}

func (api *API) removeCommentFromPayload(c *gin.Context, userID primitive.ObjectID, commentPayload LinearCommentPayload, task *database.Task) error {
	comments := task.Comments
	var commentsNew []database.Comment
	for i, comment := range *comments {
		if comment.ExternalID == commentPayload.ID {
			commentsNew = append((*comments)[:i], (*comments)[i+1:]...)
		}
	}

	return api.updateComments(task, userID, commentsNew)
}

func (api *API) updateComments(task *database.Task, userID primitive.ObjectID, commentsNew []database.Comment) error {
	updateTask := database.Task{
		Comments: &commentsNew,
	}
	return api.UpdateTaskInDBWithError(task, userID, &updateTask)
}

func (api *API) getLinearUserInfo(userID primitive.ObjectID, accountID string, externalUserID string) (*external.LinearExternalUserInfoQuery, error) {
	var err error
	taskSource, err := api.ExternalConfig.GetSourceResult(external.TASK_SOURCE_ID_LINEAR)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("unable to get task source result for linear")
		return nil, err
	}

	linearTaskSource := taskSource.Source.(external.LinearTaskSource)
	client, err := external.GetBasicLinearClient(linearTaskSource.Linear.Config.ConfigValues.UserInfoURL, api.DB, userID, accountID)
	if err != nil {
		logger.Error().Err(err).Msg("unable to create linear client")
		return nil, err
	}

	return external.GetLinearUserInfoStructByID(client, externalUserID)
}
