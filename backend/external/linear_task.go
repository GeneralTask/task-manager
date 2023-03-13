package external

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"

	"go.mongodb.org/mongo-driver/mongo"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/logging"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type LinearTaskSource struct {
	Linear LinearService
}

func (linearTask LinearTaskSource) GetEvents(db *mongo.Database, userID primitive.ObjectID, accountID string, startTime time.Time, endTime time.Time, scopes []string, result chan<- CalendarResult) {
	result <- emptyCalendarResult(errors.New("linear task cannot fetch events"))
}

func (linearTask LinearTaskSource) GetTasks(db *mongo.Database, userID primitive.ObjectID, accountID string, result chan<- TaskResult) {
	client, err := GetLinearClient(linearTask.Linear.Config.ConfigValues.UserInfoURL, db, userID, accountID)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("unable to create linear client")
		result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_LINEAR)
		return
	}
	meQuery, err := getLinearUserInfoStruct(client)
	if err != nil {
		logger.Error().Err(err).Msg("unable to get linear user details")
		result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_LINEAR)
		return
	}
	userChangeable := &database.UserChangeable{LinearName: string(meQuery.Viewer.Name), LinearDisplayName: string(meQuery.Viewer.DisplayName)}
	database.GetUserCollection(db).FindOneAndUpdate(
		context.Background(),
		bson.M{"_id": userID},
		bson.M{"$set": userChangeable},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)

	client, err = GetLinearClient(linearTask.Linear.Config.ConfigValues.TaskFetchURL, db, userID, accountID)
	if err != nil {
		logger.Error().Err(err).Msg("unable to create linear client")
		result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_LINEAR)
		return
	}
	issuesQuery, err := getLinearAssignedIssues(client, meQuery.Viewer.Email)
	if err != nil {
		logger.Error().Err(err).Msg("unable to get linear issues assigned to user")
		result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_LINEAR)
		return
	}

	client, err = GetLinearClient(linearTask.Linear.Config.ConfigValues.StatusFetchURL, db, userID, accountID)
	if err != nil {
		logger.Error().Err(err).Msg("unable to create linear client")
		result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_LINEAR)
		return
	}
	statuses, err := GetLinearWorkflowStates(client)
	if err != nil {
		logger.Error().Err(err).Msg("unable to get linear workflow states")
		result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_LINEAR)
		return
	}
	teamToStatus := ProcessLinearStatuses(statuses)

	teamToCycles := getTeamToCyclesMap(issuesQuery)

	var tasks []*database.Task
	for _, linearIssue := range issuesQuery.Issues.Nodes {
		createdAt, _ := time.Parse("2006-01-02T15:04:05.000Z", string(linearIssue.CreatedAt))
		updatedAt, _ := time.Parse("2006-01-02T15:04:05.000Z", string(linearIssue.UpdatedAt))
		stringTitle := string(linearIssue.Title)
		stringBody := string(linearIssue.Description)
		isCompleted := false
		isDeleted := false
		statusId := ""
		if linearIssue.State.Id != nil {
			statusId = (linearIssue.State.Id).(string)
		}

		task := &database.Task{
			UserID:             userID,
			IDExternal:         linearIssue.Id.(string),
			IDTaskSection:      constants.IDTaskSectionDefault,
			Deeplink:           string(linearIssue.Url),
			SourceID:           TASK_SOURCE_ID_LINEAR,
			Title:              &stringTitle,
			Body:               &stringBody,
			SourceAccountID:    accountID,
			CreatedAtExternal:  primitive.NewDateTimeFromTime(createdAt),
			UpdatedAt:          primitive.NewDateTimeFromTime(updatedAt),
			IsCompleted:        &isCompleted,
			IsDeleted:          &isDeleted,
			PriorityNormalized: (*float64)(&linearIssue.Priority),
			Status: &database.ExternalTaskStatus{
				ExternalID: statusId,
				State:      string(linearIssue.State.Name),
				Type:       string(linearIssue.State.Type),
			},
		}
		if len(linearIssue.Comments.Nodes) > 0 {
			var dbComments []database.Comment
			for _, linearComment := range linearIssue.Comments.Nodes {
				commentCreatedAt, _ := time.Parse("2006-01-02T15:04:05.000Z", string(linearComment.CreatedAt))
				dbComment := database.Comment{
					ExternalID: (linearComment.ID).(string),
					Body:       string(linearComment.Body),
					User: database.ExternalUser{
						ExternalID:  (linearComment.User.Id).(string),
						Name:        string(linearComment.User.Name),
						DisplayName: string(linearComment.User.DisplayName),
						Email:       string(linearComment.User.Email),
					},
					CreatedAt: primitive.NewDateTimeFromTime(commentCreatedAt),
				}
				dbComments = append(dbComments, dbComment)
			}
			task.Comments = &dbComments
		}
		if linearIssue.Cycle.Id != nil {
			startsAt, _ := time.Parse("2006-01-02T15:04:05.000Z", string(linearIssue.Cycle.StartsAt))
			endsAt, _ := time.Parse("2006-01-02T15:04:05.000Z", string(linearIssue.Cycle.EndsAt))
			task.LinearCycle = database.LinearCycle{
				ID:       linearIssue.Cycle.Id.(string),
				Name:     string(linearIssue.Cycle.Name),
				Number:   float32(linearIssue.Cycle.Number),
				StartsAt: primitive.NewDateTimeFromTime(startsAt),
				EndsAt:   primitive.NewDateTimeFromTime(endsAt),
			}
			teamCycles := teamToCycles[linearIssue.Team.Id.(string)]
			if teamCycles != nil {
				task.LinearCycle.IsCurrentCycle = teamCycles.ActiveCycle == float32(linearIssue.Cycle.Number)
				task.LinearCycle.IsPreviousCycle = teamCycles.PreviousCycle == float32(linearIssue.Cycle.Number)
				task.LinearCycle.IsNextCycle = teamCycles.NextCycle == float32(linearIssue.Cycle.Number)
			}
		}

		updateFields := database.Task{
			Title:              task.Title,
			Body:               task.Body,
			Comments:           task.Comments,
			Status:             task.Status,
			CompletedStatus:    task.CompletedStatus,
			IsCompleted:        task.IsCompleted,
			PriorityNormalized: task.PriorityNormalized,
			LinearCycle:        task.LinearCycle,
		}

		if linearIssue.DueDate != "" {
			dueDate, _ := time.Parse(constants.YEAR_MONTH_DAY_FORMAT, string(linearIssue.DueDate))
			primitiveDueDate := primitive.NewDateTimeFromTime(dueDate)
			updateFields.DueDate = &primitiveDueDate
		} else {
			dueDate := primitive.NewDateTimeFromTime(time.Unix(0, 0))
			updateFields.DueDate = &dueDate
		}

		// should update every time because it's possible the Team for the issue has switched
		if val, ok := teamToStatus[string(linearIssue.Team.Name)]; ok {
			updateFields.AllStatuses = val
		} else {
			err = errors.New("could not match team with status")
			logger.Error().Err(err).Send()
			result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_LINEAR)
			return
		}

		dbTask, err := database.UpdateOrCreateTask(
			db,
			userID,
			task.IDExternal,
			task.SourceID,
			task,
			updateFields,
			nil,
		)
		if err != nil {
			logger.Error().Err(err).Msg("could not create task")
			result <- emptyTaskResultWithSource(err, TASK_SOURCE_ID_LINEAR)
			return
		}
		task.HasBeenReordered = dbTask.HasBeenReordered
		task.ID = dbTask.ID
		task.IDOrdering = dbTask.IDOrdering
		task.IDTaskSection = dbTask.IDTaskSection
		task.AllStatuses = dbTask.AllStatuses
		task.DueDate = dbTask.DueDate
		tasks = append(tasks, task)
	}

	result <- TaskResult{Tasks: tasks, ServiceID: TASK_SERVICE_ID_LINEAR, AccountID: accountID}
}

func (linearTask LinearTaskSource) GetPullRequests(db *mongo.Database, userID primitive.ObjectID, accountID string, result chan<- PullRequestResult) {
	result <- emptyPullRequestResult(nil, false)
}

func (linearTask LinearTaskSource) ModifyTask(db *mongo.Database, userID primitive.ObjectID, accountID string, issueID string, updateFields *database.Task, task *database.Task) error {
	client, err := GetBasicLinearClient(linearTask.Linear.Config.ConfigValues.TaskUpdateURL, db, userID, accountID)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("unable to create linear client")
		return err
	}
	success, err := updateLinearIssue(client, issueID, updateFields, task)
	if err != nil {
		logger.Error().Err(err).Msg("unable to update linear issue")
		return err
	}
	if !success {
		logger.Error().Msg("linear mutation failed to update issue")
		return errors.New("linear mutation failed to update issue")
	}
	return nil
}

func (linearTask LinearTaskSource) CreateNewTask(db *mongo.Database, userID primitive.ObjectID, accountID string, task TaskCreationObject) (primitive.ObjectID, error) {
	return primitive.NilObjectID, errors.New("has not been implemented yet")
}

func (linearTask LinearTaskSource) CreateNewEvent(db *mongo.Database, userID primitive.ObjectID, accountID string, event EventCreateObject) error {
	return errors.New("has not been implemented yet")
}

func (linearTask LinearTaskSource) DeleteEvent(db *mongo.Database, userID primitive.ObjectID, accountID string, externalID string, calendarID string) error {
	return errors.New("has not been implemented yet")
}

func (linearTask LinearTaskSource) ModifyEvent(db *mongo.Database, userID primitive.ObjectID, accountID string, eventID string, updateFields *EventModifyObject) error {
	return errors.New("has not been implemented yet")
}

func (linearTask LinearTaskSource) AddComment(db *mongo.Database, userID primitive.ObjectID, accountID string, comment database.Comment, task *database.Task) error {
	client, err := GetBasicLinearClient(linearTask.Linear.Config.ConfigValues.TaskUpdateURL, db, userID, accountID)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("unable to create linear client")
		return err
	}
	err = addLinearComment(client, task.IDExternal, comment)
	if err != nil {
		logger.Error().Err(err).Msg("failed to create linear comment")
		return err
	}
	return nil
}
