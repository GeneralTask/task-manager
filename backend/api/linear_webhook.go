package api

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io/ioutil"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/GeneralTask/task-manager/backend/logging"
	"github.com/gin-gonic/gin"
	"github.com/shurcooL/graphql"
	"go.mongodb.org/mongo-driver/bson"
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
	Url         string           `json:"url"`
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
	case IssueType:
		var issuePayload LinearIssuePayload
		if err := json.Unmarshal([]byte(*webhookPayload.RawData), &issuePayload); err != nil {
			api.Logger.Error().Err(err).Msg("failed to unmarshal linear comment object")
			c.JSON(400, gin.H{"detail": "unable to unmarshal linear issue object"})
			return
		}
		err = api.processLinearIssueWebhook(c, webhookPayload, issuePayload)
		if err != nil {
			c.JSON(400, gin.H{"detail": "unable to process linear issue webhook"})
			return
		}
	case CommentType:
		var commentPayload LinearCommentPayload
		if err := json.Unmarshal([]byte(*webhookPayload.RawData), &commentPayload); err != nil {
			api.Logger.Error().Err(err).Msg("failed to unmarshal linear comment object")
			c.JSON(400, gin.H{"detail": "unable to unmarshal linear issue object"})
			return
		}
		err = api.processLinearCommentWebhook(c, webhookPayload, commentPayload)
		if err != nil {
			c.JSON(400, gin.H{"detail": "unable to process linear comment webhook"})
			return
		}
	default:
		api.Logger.Error().Err(err).Msg("unrecognized linear payload format")
		c.JSON(400, gin.H{"detail": "unrecognized linear payload format"})
		return
	}

	c.JSON(200, gin.H{})
}

func (api *API) processLinearIssueWebhook(c *gin.Context, webhookPayload LinearWebhookPayload, issuePayload LinearIssuePayload) error {
	logger := logging.GetSentryLogger()
	token, err := database.GetExternalTokenByExternalID(api.DB, issuePayload.AssigneeID, external.TASK_SERVICE_ID_LINEAR)
	if err != nil {
		// if the owner of the task is not found, we must check if the task exists
		// if the task does exist, we must delete as we do not want it to show on the user's list
		api.removeTaskOwnerIfExists(issuePayload)
		logger.Error().Err(err).Msg("could not find matching external ID")
		return err
	}

	userID := token.UserID
	accountID := token.AccountID

	switch webhookPayload.Action {
	case CreateAction:
		err = api.createOrModifyIssueFromPayload(userID, accountID, webhookPayload, issuePayload)
	case UpdateAction:
		err = api.createOrModifyIssueFromPayload(userID, accountID, webhookPayload, issuePayload)
	case RemoveAction:
		err = api.removeIssueFromPayload(userID, issuePayload)
	default:
		err = errors.New("action type not recognized")
		logger.Error().Err(err).Msg("invalid action type")
	}
	return err
}

func (api *API) createOrModifyIssueFromPayload(userID primitive.ObjectID, accountID string, webhookPayload LinearWebhookPayload, issuePayload LinearIssuePayload) error {
	logger := logging.GetSentryLogger()

	task := populateLinearTask(userID, accountID, webhookPayload, issuePayload)

	statuses, err := api.getTaskStatuses(userID, accountID, issuePayload)
	if err != nil {
		return err
	}

	task.AllStatuses = statuses
	task.CompletedStatus = getCompletedLinearStatus(task.AllStatuses)

	_, err = database.UpdateOrCreateTask(
		api.DB,
		userID,
		task.IDExternal,
		task.SourceID,
		nil,
		task,
		nil,
	)
	if err != nil {
		logger.Error().Err(err).Msg("could not create or update task")
		return err
	}
	return nil
}

func (api *API) removeIssueFromPayload(userID primitive.ObjectID, issuePayload LinearIssuePayload) error {
	task, err := database.GetTaskByExternalIDWithoutUser(api.DB, issuePayload.ID)
	if err != nil {
		logger := logging.GetSentryLogger()
		logger.Error().Err(err).Msg("could not find matching linear issue")
		return err
	}

	deletionState := true
	deletedAt, _ := time.Parse("2006-01-02T15:04:05.000Z", string(issuePayload.UpdatedAt))
	updateTask := database.Task{
		IsDeleted: &deletionState,
		DeletedAt: primitive.NewDateTimeFromTime(deletedAt),
	}
	return api.UpdateTaskInDBWithError(task, userID, &updateTask)
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
		err = api.createCommentFromPayload(userID, userIDExternal, accountID, commentPayload, task)
	case UpdateAction:
		err = api.modifyCommentFromPayload(userID, commentPayload, task)
	case RemoveAction:
		err = api.removeCommentFromPayload(userID, commentPayload, task)
	default:
		err = errors.New("action type not recognized")
		logger.Error().Err(err).Msg("invalid action type")
	}
	return err
}

func (api *API) createCommentFromPayload(userID primitive.ObjectID, externalUserID string, accountID string, commentPayload LinearCommentPayload, task *database.Task) error {
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

func (api *API) modifyCommentFromPayload(userID primitive.ObjectID, commentPayload LinearCommentPayload, task *database.Task) error {
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

func (api *API) removeCommentFromPayload(userID primitive.ObjectID, commentPayload LinearCommentPayload, task *database.Task) error {
	comments := task.Comments
	var commentsNew []database.Comment
	for _, comment := range *comments {
		if comment.ExternalID != commentPayload.ID {
			commentsNew = append(commentsNew, comment)
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

func (api *API) getLinearStatusClient(userID primitive.ObjectID, accountID string) (*graphql.Client, error) {
	logger := logging.GetSentryLogger()

	linearTaskSource, err := api.getLinearTaskSource()
	if err != nil {
		logger.Error().Err(err).Msg("unable to get task source result for linear")
		return nil, err
	}

	client, err := external.GetLinearClient(linearTaskSource.Linear.Config.ConfigValues.StatusFetchURL, api.DB, userID, accountID)
	if err != nil {
		logger.Error().Err(err).Msg("unable to create linear client")
		return nil, err
	}

	return client, nil
}

func (api *API) getLinearUserInfo(userID primitive.ObjectID, accountID string, externalUserID string) (*external.LinearExternalUserInfoQuery, error) {
	logger := logging.GetSentryLogger()

	linearTaskSource, err := api.getLinearTaskSource()
	if err != nil {
		logger.Error().Err(err).Msg("unable to get task source result for linear")
		return nil, err
	}

	client, err := external.GetBasicLinearClient(linearTaskSource.Linear.Config.ConfigValues.UserInfoURL, api.DB, userID, accountID)
	if err != nil {
		logger.Error().Err(err).Msg("unable to create linear client")
		return nil, err
	}

	return external.GetLinearUserInfoStructByID(client, externalUserID)
}

func populateLinearTask(userID primitive.ObjectID, accountID string, webhookPayload LinearWebhookPayload, issuePayload LinearIssuePayload) *database.Task {
	issueCreatedAt, _ := time.Parse("2006-01-02T15:04:05.000Z", string(issuePayload.CreatedAt))
	_false := false
	priorityFloat := (float64)(issuePayload.Priority)

	task := &database.Task{
		UserID:             userID,
		IDExternal:         issuePayload.ID,
		IDTaskSection:      constants.IDTaskSectionDefault,
		Deeplink:           webhookPayload.Url,
		SourceID:           external.TASK_SOURCE_ID_LINEAR,
		Title:              &issuePayload.Title,
		Body:               &issuePayload.Description,
		SourceAccountID:    issuePayload.AssigneeID,
		CreatedAtExternal:  primitive.NewDateTimeFromTime(issueCreatedAt),
		IsCompleted:        &_false,
		IsDeleted:          &_false,
		PriorityNormalized: &priorityFloat,
		Status: &database.ExternalTaskStatus{
			ExternalID: issuePayload.State.ID,
			State:      issuePayload.State.Name,
			Type:       issuePayload.State.Type,
		},
	}

	if issuePayload.DueDate != "" {
		dueDate, _ := time.Parse("2006-01-02", string(issuePayload.DueDate))
		primitiveDueDate := primitive.NewDateTimeFromTime(dueDate)
		task.DueDate = &primitiveDueDate
	} else {
		dueDate := primitive.NewDateTimeFromTime(time.Unix(0, 0))
		task.DueDate = &dueDate
	}

	return task
}

func getCompletedLinearStatus(teamStatuses []*database.ExternalTaskStatus) *database.ExternalTaskStatus {
	for _, status := range teamStatuses {
		if status.Type == external.LinearCompletedType {
			return status
		}
	}
	return nil
}

func (api *API) removeTaskOwnerIfExists(issuePayload LinearIssuePayload) {
	task, err := database.GetTaskByExternalIDWithoutUser(api.DB, issuePayload.ID)
	if err != nil {
		// don't log this error because could be a task that shouldn't exist in GT
		return
	}

	taskCollection := database.GetTaskCollection(api.DB)
	_, err = taskCollection.DeleteOne(
		context.Background(),
		bson.M{"_id": task.ID},
	)
	if err != nil {
		logger := logging.GetSentryLogger()
		logger.Error().Err(err).Msg("unable to delete task with owner not in GT")
	}
}

func (api *API) getTaskStatuses(userID primitive.ObjectID, accountID string, issuePayload LinearIssuePayload) ([]*database.ExternalTaskStatus, error) {
	logger := logging.GetSentryLogger()

	client, err := api.getLinearStatusClient(userID, accountID)
	if err != nil {
		logger.Error().Err(err).Msg("unable to generate linear client")
		return nil, err
	}

	statuses, err := external.GetLinearWorkflowStates(client)
	if err != nil {
		logger.Error().Err(err).Msg("unable to get linear workflow states")
		return nil, err
	}
	teamToStatus := external.ProcessLinearStatuses(statuses)
	if val, ok := teamToStatus[string(issuePayload.Team.Name)]; ok {
		return val, nil
	}

	err = errors.New("could not match team with status")
	logger.Error().Err(err).Send()
	return nil, err
}

func (api *API) getLinearTaskSource() (external.LinearTaskSource, error) {
	logger := logging.GetSentryLogger()

	taskSource, err := api.ExternalConfig.GetSourceResult(external.TASK_SOURCE_ID_LINEAR)
	if err != nil {
		logger.Error().Err(err).Msg("unable to get task source result for linear")
		return external.LinearTaskSource{}, err
	}

	linearTaskSource := taskSource.Source.(external.LinearTaskSource)
	return linearTaskSource, nil
}
