package api

import (
	"context"
	"errors"
	"fmt"
	"sort"
	"time"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type SourcesResult struct {
	Name             string  `json:"name"`
	AuthorizationURL *string `json:"authorization_url"`
}

type ViewItem interface {
	TaskResult | PullRequestResult
	GetID() string
}

type OverviewResult[T ViewItem] struct {
	ID            primitive.ObjectID `json:"id"`
	Name          string             `json:"name"`
	Type          constants.ViewType `json:"type"`
	Logo          string             `json:"logo"`
	IsLinked      bool               `json:"is_linked"`
	Sources       []SourcesResult    `json:"sources"`
	TaskSectionID primitive.ObjectID `json:"task_section_id"`
	IsReorderable bool               `json:"is_reorderable"`
	IDOrdering    int                `json:"ordering_id"`
	ViewItems     []*T               `json:"view_items"`
}

type SupportedViewItem struct {
	Name          string             `json:"name"`
	IsAdded       bool               `json:"is_added"`
	TaskSectionID primitive.ObjectID `json:"task_section_id"`
	GithubID      string             `json:"github_id"`
	ViewID        primitive.ObjectID `json:"view_id"`
}

type SupportedView struct {
	Type             constants.ViewType  `json:"type"`
	Name             string              `json:"name"`
	Logo             string              `json:"logo"`
	IsNested         bool                `json:"is_nested"`
	IsLinked         bool                `json:"is_linked"`
	AuthorizationURL string              `json:"authorization_url"`
	Views            []SupportedViewItem `json:"views"`
}

func (api *API) OverviewViewsList(c *gin.Context) {
	timezoneOffset, err := GetTimezoneOffsetFromHeader(c)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	userID := getUserIDFromContext(c)
	_, err = database.GetUser(api.DB, userID)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to find user")
		Handle500(c)
		return
	}

	cursor, err := database.GetViewCollection(api.DB).Find(
		context.Background(),
		bson.M{"user_id": userID},
	)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to find views")
		Handle500(c)
		return
	}

	var views []database.View
	err = cursor.All(context.Background(), &views)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to find views")
		Handle500(c)
		return
	}
	err = api.UpdateViewsLinkedStatus(&views, userID)
	if err != nil {
		log.Print("failed to get views")

		api.Logger.Error().Err(err).Msg("failed to update views")
		Handle500(c)
		return
	}

	result, err := api.GetOverviewResults(views, userID, timezoneOffset)
	if err != nil {
		log.Print("failed to get results")
		api.Logger.Error().Err(err).Msg("failed to load views")
		Handle500(c)
		return
	}
	sort.SliceStable(result, func(i, j int) bool {
		return result[i].GetOrderingID() < result[j].GetOrderingID()
	})

	c.JSON(200, result)
}

func (api *API) GetOverviewResults(views []database.View, userID primitive.ObjectID, timezoneOffset time.Duration) ([]OrderingIDGetter, error) {
	result := []OrderingIDGetter{}
	for _, view := range views {
		var singleOverviewResult OrderingIDGetter
		var err error
		switch view.Type {
		case string(constants.ViewTaskSection):
			singleOverviewResult, err = api.GetTaskSectionOverviewResult(view, userID)
		case string(constants.ViewLinear):
			singleOverviewResult, err = api.GetLinearOverviewResult(view, userID)
		case string(constants.ViewSlack):
			singleOverviewResult, err = api.GetSlackOverviewResult(view, userID)
		case string(constants.ViewGithub):
			singleOverviewResult, err = api.GetGithubOverviewResult(view, userID)
		case string(constants.ViewMeetingPreparation):
			singleOverviewResult, err = api.GetMeetingPreparationOverviewResult(view, userID, timezoneOffset)
		case string(constants.ViewDueToday):
			singleOverviewResult, err = api.GetDueTodayOverviewResult(view, userID, timezoneOffset)
		default:
			err = errors.New("invalid view type")
		}
		if err != nil {
			return nil, err
		}
		if singleOverviewResult != nil {
			// allow for the case of removing an obsolete view without an error
			result = append(result, singleOverviewResult)
		}
	}
	return result, nil
}

func (api *API) GetTaskSectionOverviewResult(view database.View, userID primitive.ObjectID) (*OverviewResult[TaskResult], error) {
	if view.UserID != userID {
		return nil, errors.New("invalid user")
	}
	name, err := database.GetTaskSectionName(api.DB, view.TaskSectionID, userID)
	if err != nil {
		if err != mongo.ErrNoDocuments {
			return nil, err
		}
		_, err = database.GetViewCollection(api.DB).DeleteOne(context.Background(), bson.M{"_id": view.ID})
		return nil, err
	}

	tasks, err := database.GetTasks(api.DB, userID, &[]bson.M{
		{"is_completed": false},
		{"is_deleted": bson.M{"$ne": true}},
		{"id_task_section": view.TaskSectionID},
	}, nil)
	if err != nil {
		return nil, err
	}
	sort.Slice(*tasks, func(i, j int) bool {
		return (*tasks)[i].IDOrdering < (*tasks)[j].IDOrdering
	})

	// Reset ID orderings to begin at 1
	taskResults := api.taskListToTaskResultList(tasks, userID)
	taskCollection := database.GetTaskCollection(api.DB)
	orderingID := 1
	for _, task := range taskResults {
		if task.IDOrdering != orderingID {
			task.IDOrdering = orderingID
			res, err := taskCollection.UpdateOne(
				context.Background(),
				bson.M{"_id": task.ID},
				bson.M{"$set": bson.M{"id_ordering": task.IDOrdering}},
			)
			if err != nil {
				return nil, err
			}
			if res.MatchedCount != 1 {
				api.Logger.Error().Interface("taskResult", task).Msgf("did not find task to update ordering ID (ID=%v)", task.ID)
				return nil, errors.New("failed to update task ordering")
			}
		}
		orderingID++
	}
	return &OverviewResult[TaskResult]{
		ID:            view.ID,
		Name:          name,
		Logo:          external.TaskServiceGeneralTask.LogoV2,
		Type:          constants.ViewTaskSection,
		IsLinked:      view.IsLinked,
		Sources:       []SourcesResult{},
		TaskSectionID: view.TaskSectionID,
		IsReorderable: view.IsReorderable,
		IDOrdering:    view.IDOrdering,
		ViewItems:     taskResults,
	}, nil
}

func (api *API) IsServiceLinked(db *mongo.Database, userID primitive.ObjectID, serviceID string) (bool, error) {
	if serviceID == external.TASK_SERVICE_ID_GT {
		return true, nil
	}
	externalAPITokenCollection := database.GetExternalTokenCollection(db)
	count, err := externalAPITokenCollection.CountDocuments(
		context.Background(),
		bson.M{
			"$and": []bson.M{
				{"user_id": userID},
				{"service_id": serviceID},
			},
		}, nil,
	)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to count api tokens")
		return false, err
	}
	return count > 0, nil
}

func (api *API) UpdateViewsLinkedStatus(views *[]database.View, userID primitive.ObjectID) error {
	for index, view := range *views {
		if view.UserID != userID {
			return errors.New("invalid user")
		}
		var serviceID string
		if view.Type == string(constants.ViewTaskSection) || view.Type == string(constants.ViewMeetingPreparation) || view.Type == string(constants.ViewDueToday) {
			serviceID = external.TaskServiceGeneralTask.ID
		} else if view.Type == string(constants.ViewLinear) {
			serviceID = external.TaskServiceLinear.ID
		} else if view.Type == string(constants.ViewSlack) {
			serviceID = external.TaskServiceSlack.ID
		} else if view.Type == string(constants.ViewGithub) {
			serviceID = external.TaskServiceGithub.ID
		} else {
			return errors.New("invalid view type")
		}
		isLinked, err := api.IsServiceLinked(api.DB, userID, serviceID)
		if err != nil {
			api.Logger.Error().Err(err).Msg("failed to check if service is linked")
			return err
		}
		// If view is linked but service does not exist, update view to unlinked and vice versa
		if view.IsLinked != isLinked {
			_, err := database.GetViewCollection(api.DB).UpdateOne(
				context.Background(),
				bson.M{"_id": view.ID},
				bson.M{"$set": bson.M{"is_linked": isLinked}},
			)
			if err != nil {
				api.Logger.Error().Err(err).Msg("failed to update view")
				return err
			}
			(*views)[index].IsLinked = isLinked
		}
	}
	return nil
}

func (api *API) GetLinearOverviewResult(view database.View, userID primitive.ObjectID) (*OverviewResult[TaskResult], error) {
	if view.UserID != userID {
		return nil, errors.New("invalid user")
	}
	authURL := config.GetAuthorizationURL(external.TASK_SERVICE_ID_LINEAR)
	result := OverviewResult[TaskResult]{
		ID:       view.ID,
		Name:     constants.ViewLinearName,
		Logo:     external.TaskServiceLinear.LogoV2,
		Type:     constants.ViewLinear,
		IsLinked: view.IsLinked,
		Sources: []SourcesResult{
			{
				Name:             constants.ViewLinearSourceName,
				AuthorizationURL: &authURL,
			},
		},
		TaskSectionID: view.TaskSectionID,
		IsReorderable: view.IsReorderable,
		IDOrdering:    view.IDOrdering,
		ViewItems:     []*TaskResult{},
	}
	if !view.IsLinked {
		return &result, nil
	}

	linearTasks, err := database.GetTasks(api.DB, userID, &[]bson.M{
		{"is_completed": false},
		{"is_deleted": bson.M{"$ne": true}},
		{"source_id": external.TASK_SOURCE_ID_LINEAR},
	}, nil)
	if err != nil {
		return nil, err
	}
	taskResults := api.taskListToTaskResultList(linearTasks, userID)
	result.IsLinked = view.IsLinked
	result.ViewItems = taskResults
	return &result, nil
}

func (api *API) GetSlackOverviewResult(view database.View, userID primitive.ObjectID) (*OverviewResult[TaskResult], error) {
	if view.UserID != userID {
		return nil, errors.New("invalid user")
	}
	authURL := config.GetAuthorizationURL(external.TASK_SERVICE_ID_SLACK)
	result := OverviewResult[TaskResult]{
		ID:       view.ID,
		Name:     constants.ViewSlackName,
		Logo:     external.TaskServiceSlack.LogoV2,
		Type:     constants.ViewSlack,
		IsLinked: view.IsLinked,
		Sources: []SourcesResult{
			{
				Name:             constants.ViewSlackSourceName,
				AuthorizationURL: &authURL,
			},
		},
		TaskSectionID: view.TaskSectionID,
		IsReorderable: view.IsReorderable,
		IDOrdering:    view.IDOrdering,
		ViewItems:     []*TaskResult{},
	}
	if !view.IsLinked {
		return &result, nil
	}

	slackTasks, err := database.GetTasks(api.DB, userID, &[]bson.M{
		{"is_completed": false},
		{"is_deleted": bson.M{"$ne": true}},
		{"source_id": external.TASK_SOURCE_ID_SLACK_SAVED},
	}, nil)
	if err != nil {
		return nil, err
	}
	taskResults := api.taskListToTaskResultList(slackTasks, userID)
	result.IsLinked = view.IsLinked
	result.ViewItems = taskResults
	return &result, nil
}

func (api *API) GetGithubOverviewResult(view database.View, userID primitive.ObjectID) (*OverviewResult[PullRequestResult], error) {
	if view.UserID != userID {
		return nil, errors.New("invalid user")
	}
	authURL := config.GetAuthorizationURL(external.TASK_SERVICE_ID_GITHUB)
	repositoryCollection := database.GetRepositoryCollection(api.DB)
	var repository database.Repository
	err := repositoryCollection.FindOne(context.Background(), bson.M{"$and": []bson.M{{"repository_id": view.GithubID, "user_id": userID}}}).Decode(&repository)
	if err != nil {
		return nil, err
	}

	result := OverviewResult[PullRequestResult]{
		ID:       view.ID,
		Name:     fmt.Sprintf("GitHub PRs from %s", repository.FullName),
		Logo:     external.TaskServiceGithub.LogoV2,
		Type:     constants.ViewGithub,
		IsLinked: view.IsLinked,
		Sources: []SourcesResult{
			{
				Name:             constants.ViewGithubName,
				AuthorizationURL: &authURL,
			},
		},
		TaskSectionID: view.TaskSectionID,
		IsReorderable: view.IsReorderable,
		IDOrdering:    view.IDOrdering,
		ViewItems:     []*PullRequestResult{},
	}
	if !view.IsLinked {
		return &result, nil
	}

	githubPRs, err := database.GetPullRequests(api.DB, userID,
		&[]bson.M{
			{"is_completed": false},
			{"repository_id": view.GithubID},
		},
	)
	if err != nil {
		return nil, err
	}
	pullResults := []*PullRequestResult{}
	// TODO we should change our Github logic to include all a user's repos in a DB
	// then we should split the Github into per repo (this is currently all the user's repo PRs)
	for _, pullRequest := range *githubPRs {
		pullRequestResult := getResultFromPullRequest(pullRequest)
		pullResults = append(pullResults, &pullRequestResult)
	}
	api.sortPullRequestResults(pullResults)
	result.ViewItems = pullResults
	return &result, nil
}

func (api *API) GetMeetingPreparationOverviewResult(view database.View, userID primitive.ObjectID, timezoneOffset time.Duration) (*OverviewResult[TaskResult], error) {
	if view.UserID != userID {
		return nil, errors.New("invalid user")
	}
	timeNow := api.GetCurrentLocalizedTime(timezoneOffset)
	events, err := database.GetEventsUntilEndOfDay(api.DB, userID, timeNow)
	if err != nil {
		return nil, err
	}

	// Create new meeting prep tasks for events. Ignore events if meeting prep task already exists
	err = CreateMeetingTasksFromEvents(api.DB, userID, events)
	if err != nil {
		return nil, err
	}

	// Get all meeting prep tasks for user
	meetingTasks, err := database.GetMeetingPreparationTasks(api.DB, userID)
	if err != nil {
		return nil, err
	}

	// Sort by datetime_start
	sort.Slice(*meetingTasks, func(i, j int) bool {
		return (*meetingTasks)[i].MeetingPreparationParams.DatetimeStart <= (*meetingTasks)[j].MeetingPreparationParams.DatetimeStart
	})

	// Create result of meeting prep tasks
	result, err := api.GetMeetingPrepTaskResult(userID, timeNow, meetingTasks)
	if err != nil {
		return nil, err
	}

	return &OverviewResult[TaskResult]{
		ID:            view.ID,
		Name:          constants.ViewMeetingPreparationName,
		Logo:          external.TaskSourceGoogleCalendar.LogoV2,
		Type:          constants.ViewMeetingPreparation,
		IsLinked:      true,
		Sources:       []SourcesResult{},
		TaskSectionID: view.TaskSectionID,
		IsReorderable: view.IsReorderable,
		IDOrdering:    view.IDOrdering,
		ViewItems:     result,
	}, nil
}

func (api *API) GetDueTodayOverviewResult(view database.View, userID primitive.ObjectID, timezoneOffset time.Duration) (*OverviewResult[TaskResult], error) {
	if view.UserID != userID {
		return nil, errors.New("invalid user")
	}
	result := OverviewResult[TaskResult]{
		ID:            view.ID,
		Name:          constants.ViewDueTodayName,
		Logo:          external.TaskServiceGeneralTask.LogoV2,
		Type:          constants.ViewDueToday,
		IsLinked:      true,
		Sources:       []SourcesResult{},
		TaskSectionID: view.TaskSectionID,
		IsReorderable: view.IsReorderable,
		IDOrdering:    view.IDOrdering,
		ViewItems:     []*TaskResult{},
	}

	timeNow := api.GetCurrentLocalizedTime(timezoneOffset)
	timeEndOfDay := time.Date(timeNow.Year(), timeNow.Month(), timeNow.Day(), 23, 59, 59, 0, time.FixedZone("", 0))
	dueTasks, err := database.GetTasks(api.DB, userID, &[]bson.M{
		{"is_completed": false},
		{"is_deleted": bson.M{"$ne": true}},
		{"due_date": bson.M{"$lte": primitive.NewDateTimeFromTime(timeEndOfDay)}},
		{"due_date": bson.M{"$ne": primitive.NewDateTimeFromTime(time.Time{})}},
		{"due_date": bson.M{"$ne": primitive.NewDateTimeFromTime(time.Unix(0, 0))}},
	}, nil)
	if err != nil {
		return nil, err
	}
	taskResults := api.taskListToTaskResultList(dueTasks, userID)
	taskResults = reorderTaskResultsByDueDate(taskResults)
	result.ViewItems = taskResults
	return &result, nil
}

func reorderTaskResultsByDueDate(taskResults []*TaskResult) []*TaskResult {
	sort.SliceStable(taskResults, func(i, j int) bool {
		a := taskResults[i]
		b := taskResults[j]
		aTime, _ := time.Parse("2006-01-02", a.DueDate)
		bTime, _ := time.Parse("2006-01-02", b.DueDate)
		return aTime.Unix() < bTime.Unix()
	})
	for idx, result := range taskResults {
		result.IDOrdering = idx
	}
	return taskResults
}

func CreateMeetingTasksFromEvents(db *mongo.Database, userID primitive.ObjectID, events *[]database.CalendarEvent) error {
	taskCollection := database.GetTaskCollection(db)
	for _, event := range *events {
		// Check if meeting prep task exists
		var meetingTask *database.Task
		err := taskCollection.FindOne(
			context.Background(),
			bson.M{"$and": []bson.M{
				{"user_id": userID},
				{"is_meeting_preparation_task": true},
				{"meeting_preparation_params.id_external": event.IDExternal},
				{"source_id": event.SourceID},
			},
			}).Decode(&meetingTask)

		if err != nil && err != mongo.ErrNoDocuments {
			return err
		}
		// Update meeting prep task for event
		if meetingTask != nil {
			_, err := taskCollection.UpdateOne(
				context.Background(),
				bson.M{"_id": meetingTask.ID},
				bson.M{"$set": bson.M{
					"title": event.Title,
					"meeting_preparation_params.datetime_start": event.DatetimeStart,
				}},
			)
			if err != nil {
				return err
			}
			continue
		}
		// Create meeting prep task for event if one does not exist
		isCompleted := false
		isDeleted := false
		_, err = taskCollection.InsertOne(context.Background(), database.Task{
			Title:                    &event.Title,
			UserID:                   userID,
			IsCompleted:              &isCompleted,
			IsDeleted:                &isDeleted,
			SourceID:                 event.SourceID,
			IsMeetingPreparationTask: true,
			MeetingPreparationParams: &database.MeetingPreparationParams{
				CalendarEventID:               event.ID,
				IDExternal:                    event.IDExternal,
				DatetimeStart:                 event.DatetimeStart,
				DatetimeEnd:                   event.DatetimeEnd,
				HasBeenAutomaticallyCompleted: false,
			},
		})
		if err != nil {
			return err
		}
	}
	return nil
}

// GetMeetingPrepTaskResult returns a result of meeting prep tasks for a user, and auto-completes tasks that have ended
func (api *API) GetMeetingPrepTaskResult(userID primitive.ObjectID, expirationTime time.Time, tasks *[]database.Task) ([]*TaskResult, error) {
	eventCollection := database.GetCalendarEventCollection(api.DB)
	taskCollection := database.GetTaskCollection(api.DB)
	result := []*TaskResult{}
	for _, task := range *tasks {
		// if meeting has ended or linked event no longer exists, mark task as complete
		count, err := eventCollection.CountDocuments(context.Background(), bson.M{"_id": task.MeetingPreparationParams.CalendarEventID})
		if err != nil {
			return nil, err
		}
		if count == int64(0) || task.MeetingPreparationParams.DatetimeEnd.Time().Before(expirationTime) && !task.MeetingPreparationParams.HasBeenAutomaticallyCompleted {
			_, err := taskCollection.UpdateOne(
				context.Background(),
				bson.M{"$and": []bson.M{
					{"_id": task.ID},
					{"user_id": userID},
				}},
				bson.M{"$set": bson.M{
					"is_completed": true,
					"completed_at": primitive.NewDateTimeFromTime(time.Now()),
					"meeting_preparation_params.has_been_automatically_completed": true,
				}})
			if err != nil {
				return nil, err
			}
			continue
		}
		result = append(result, api.taskBaseToTaskResult(&task, userID))
	}
	return result, nil
}

type ViewCreateParams struct {
	Type          string  `json:"type" binding:"required"`
	TaskSectionID *string `json:"task_section_id"`
	GithubID      *string `json:"github_id"`
}

func (api *API) OverviewViewAdd(c *gin.Context) {
	var viewCreateParams ViewCreateParams
	err := c.BindJSON(&viewCreateParams)
	if err != nil {
		c.JSON(400, gin.H{"detail": "invalid or missing parameter"})
		return
	}
	if viewCreateParams.Type == string(constants.ViewTaskSection) && viewCreateParams.TaskSectionID == nil {
		c.JSON(400, gin.H{"detail": "'task_section_id' is required for task section type views"})
		return
	} else if viewCreateParams.Type == string(constants.ViewGithub) && viewCreateParams.GithubID == nil {
		c.JSON(400, gin.H{"detail": "'id_github' is required for github type views"})
		return
	}

	userID := getUserIDFromContext(c)
	viewExists, err := api.ViewDoesExist(api.DB, userID, viewCreateParams)
	if err != nil {
		api.Logger.Error().Err(err).Msg("error checking that view does not exist")
		Handle500(c)
		return
	}
	if viewExists {
		c.JSON(400, gin.H{"detail": "view already exists"})
		return
	}
	var serviceID string
	taskSectionID := primitive.NilObjectID
	var githubID string
	if viewCreateParams.Type == string(constants.ViewTaskSection) {
		serviceID = external.TASK_SERVICE_ID_GT
		taskSectionID, err = getValidTaskSection(*viewCreateParams.TaskSectionID, userID, api.DB)
		if err != nil {
			c.JSON(400, gin.H{"detail": "'task_section_id' is not a valid ID"})
			return
		}
	} else if viewCreateParams.Type == string(constants.ViewLinear) {
		serviceID = external.TASK_SERVICE_ID_LINEAR
	} else if viewCreateParams.Type == string(constants.ViewGithub) {
		serviceID = external.TASK_SERVICE_ID_GITHUB
		isValidGithubRepository, err := isValidGithubRepository(api.DB, userID, *viewCreateParams.GithubID)
		if err != nil {
			api.Logger.Error().Err(err).Msg("error checking that github repository is valid")
			Handle500(c)
			return
		}
		if !isValidGithubRepository {
			c.JSON(400, gin.H{"detail": "invalid 'id_github'"})
			return
		}
		githubID = *viewCreateParams.GithubID
	} else if viewCreateParams.Type != string(constants.ViewLinear) && viewCreateParams.Type != string(constants.ViewSlack) && viewCreateParams.Type != string(constants.ViewMeetingPreparation) && viewCreateParams.Type != string(constants.ViewDueToday) {
		c.JSON(400, gin.H{"detail": "unsupported 'type'"})
		return
	}

	isLinked, err := api.IsServiceLinked(api.DB, userID, serviceID)
	if err != nil {
		api.Logger.Error().Err(err).Msg("error checking that service is linked")
		Handle500(c)
		return
	}
	view := database.View{
		UserID:        userID,
		IDOrdering:    1,
		Type:          viewCreateParams.Type,
		IsLinked:      isLinked,
		TaskSectionID: taskSectionID,
		GithubID:      githubID,
	}

	viewCollection := database.GetViewCollection(api.DB)
	insertedView, err := viewCollection.InsertOne(context.Background(), view)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to create view")
		Handle500(c)
		return
	}
	c.JSON(200, gin.H{
		"id": insertedView.InsertedID.(primitive.ObjectID).Hex(),
	})
}

func (api *API) ViewDoesExist(db *mongo.Database, userID primitive.ObjectID, params ViewCreateParams) (bool, error) {
	viewCollection := database.GetViewCollection(db)
	dbQuery := bson.M{
		"$and": []bson.M{
			{"user_id": userID},
			{"type": params.Type},
		},
	}
	if params.Type == string(constants.ViewTaskSection) {
		if params.TaskSectionID == nil {
			return false, errors.New("'task_section_id' is required for task section type views")
		}
		taskSectionObjectID, err := primitive.ObjectIDFromHex(*params.TaskSectionID)
		if err != nil {
			return false, errors.New("'task_section_id' is not a valid ObjectID")
		}
		dbQuery["$and"] = append(dbQuery["$and"].([]bson.M), bson.M{"task_section_id": taskSectionObjectID})
	} else if params.Type == string(constants.ViewGithub) {
		if params.GithubID == nil {
			return false, errors.New("'github_id' is required for github type views")
		}
		dbQuery["$and"] = append(dbQuery["$and"].([]bson.M), bson.M{"github_id": *params.GithubID})
	} else if params.Type != string(constants.ViewLinear) && params.Type != string(constants.ViewSlack) && params.Type != string(constants.ViewMeetingPreparation) && params.Type != string(constants.ViewDueToday) {
		return false, errors.New("unsupported view type")
	}
	count, err := viewCollection.CountDocuments(context.Background(), dbQuery)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

type ViewModifyParams struct {
	IDOrdering int `json:"id_ordering" binding:"required"`
}

func (api *API) OverviewViewModify(c *gin.Context) {
	viewID, err := getViewIDFromContext(c)
	if err != nil {
		Handle404(c)
		return
	}
	var viewModifyParams ViewModifyParams
	err = c.BindJSON(&viewModifyParams)
	if err != nil {
		c.JSON(400, gin.H{"detail": "invalid or missing parameter"})
		return
	}

	viewCollection := database.GetViewCollection(api.DB)
	userID := getUserIDFromContext(c)
	result, err := viewCollection.UpdateOne(
		context.Background(),
		bson.M{"$and": []bson.M{
			{"user_id": userID},
			{"_id": viewID},
		}},
		bson.M{"$set": bson.M{"id_ordering": viewModifyParams.IDOrdering}},
	)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to modify view id_ordering")
		Handle500(c)
		return
	}
	if result.MatchedCount != 1 {
		Handle404(c)
		return
	}

	err = database.AdjustOrderingIDsForCollection(viewCollection, userID, viewID, viewModifyParams.IDOrdering)
	if err != nil {
		Handle500(c)
		return
	}
	c.JSON(200, gin.H{})
}

func (api *API) OverviewViewDelete(c *gin.Context) {
	userID := getUserIDFromContext(c)
	viewID, err := getViewIDFromContext(c)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to parse view id")
		Handle404(c)
		return
	}
	_, err = database.GetUser(api.DB, userID)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to find user")
		Handle500(c)
		return
	}

	deleteResult, err := database.GetViewCollection(api.DB).DeleteOne(
		context.Background(),
		bson.M{"$and": []bson.M{{"_id": viewID}, {"user_id": userID}}},
	)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to delete view")
		Handle500(c)
		return
	}
	if deleteResult.DeletedCount != 1 {
		api.Logger.Error().Msgf("failed to delete view with id: %s", c.Param("view_id"))
		Handle404(c)
		return
	}

	c.JSON(200, gin.H{})
}
func (api *API) OverviewSupportedViewsList(c *gin.Context) {
	userID := getUserIDFromContext(c)
	supportedTaskSectionViews, err := api.getSupportedTaskSectionViews(api.DB, userID)
	if err != nil {
		Handle500(c)
		return
	}
	supportedGithubViews, err := api.getSupportedGithubViews(api.DB, userID)
	if err != nil {
		Handle500(c)
		return
	}
	isGithubLinked, err := api.IsServiceLinked(api.DB, userID, external.TASK_SERVICE_ID_GITHUB)
	if err != nil {
		Handle500(c)
		return
	}
	isLinearLinked, err := api.IsServiceLinked(api.DB, userID, external.TASK_SERVICE_ID_LINEAR)
	if err != nil {
		Handle500(c)
		return
	}
	isSlackLinked, err := api.IsServiceLinked(api.DB, userID, external.TASK_SERVICE_ID_SLACK)
	if err != nil {
		Handle500(c)
		return
	}

	var githubAuthURL string
	var linearAuthURL string
	var slackAuthURL string
	if !isGithubLinked {
		githubAuthURL = config.GetAuthorizationURL(external.TASK_SERVICE_ID_GITHUB)
	}
	if !isLinearLinked {
		linearAuthURL = config.GetAuthorizationURL(external.TASK_SERVICE_ID_LINEAR)
	}
	if !isSlackLinked {
		slackAuthURL = config.GetAuthorizationURL(external.TASK_SERVICE_ID_SLACK)
	}

	supportedViews := []SupportedView{
		{
			Type:     constants.ViewMeetingPreparation,
			Name:     "Meeting Preparation for the day",
			Logo:     external.TaskSourceGoogleCalendar.LogoV2,
			IsNested: false,
			IsLinked: true,
			Views: []SupportedViewItem{
				{
					Name:    constants.ViewMeetingPreparationName,
					IsAdded: false,
				},
			},
		},
		{
			Type:     constants.ViewDueToday,
			Name:     "Tasks Due Today",
			Logo:     external.TaskServiceGeneralTask.LogoV2,
			IsNested: false,
			IsLinked: true,
			Views: []SupportedViewItem{
				{
					Name:    "Tasks Due Today View",
					IsAdded: true,
				},
			},
		},
		{
			Type:     constants.ViewTaskSection,
			Name:     "Task Sections",
			Logo:     external.TaskServiceGeneralTask.LogoV2,
			IsNested: true,
			IsLinked: true,
			Views:    supportedTaskSectionViews,
		},
		{
			Type:             constants.ViewLinear,
			Name:             "Linear",
			Logo:             "linear",
			IsNested:         false,
			IsLinked:         isLinearLinked,
			AuthorizationURL: linearAuthURL,
			Views: []SupportedViewItem{
				{
					Name:    "Linear View",
					IsAdded: true,
				},
			},
		},
		{
			Type:             constants.ViewSlack,
			Name:             "Slack",
			Logo:             "slack",
			IsNested:         false,
			IsLinked:         isSlackLinked,
			AuthorizationURL: slackAuthURL,
			Views: []SupportedViewItem{
				{
					Name:    "Slack View",
					IsAdded: true,
				},
			},
		},
		{
			Type:             constants.ViewGithub,
			Name:             "GitHub",
			Logo:             "github",
			IsNested:         true,
			IsLinked:         isGithubLinked,
			AuthorizationURL: githubAuthURL,
			Views:            supportedGithubViews,
		},
	}
	err = api.updateIsAddedForSupportedViews(api.DB, userID, &supportedViews)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to updated isAdded")
		Handle500(c)
		return
	}
	c.JSON(200, supportedViews)
}

func (api *API) getSupportedTaskSectionViews(db *mongo.Database, userID primitive.ObjectID) ([]SupportedViewItem, error) {
	sections, err := database.GetTaskSections(db, userID)
	if err != nil || sections == nil {
		api.Logger.Error().Err(err).Msg("failed to fetch sections for user")
		return []SupportedViewItem{}, err
	}

	defaultSectionName := database.GetDefaultSectionName(api.DB, userID)
	supportedViewItems := []SupportedViewItem{{
		Name:          defaultSectionName,
		TaskSectionID: constants.IDTaskSectionDefault,
	}}
	sort.SliceStable(*sections, func(i, j int) bool {
		a := (*sections)[i]
		b := (*sections)[j]
		return a.IDOrdering < b.IDOrdering
	})
	for _, section := range *sections {
		supportedViewItems = append(supportedViewItems, SupportedViewItem{
			Name:          section.Name,
			TaskSectionID: section.ID,
		})
	}
	return supportedViewItems, nil
}

func (api *API) getSupportedGithubViews(db *mongo.Database, userID primitive.ObjectID) ([]SupportedViewItem, error) {
	repositoryCollection := database.GetRepositoryCollection(db)
	var repositories []database.Repository
	cursor, err := repositoryCollection.Find(context.Background(), bson.M{"user_id": userID})
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to fetch repositories for user")
		return []SupportedViewItem{}, err
	}

	err = cursor.All(context.Background(), &repositories)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to fetch repositories for user")
		return []SupportedViewItem{}, err
	}

	supportedViewItems := []SupportedViewItem{}
	for _, repo := range repositories {
		supportedViewItems = append(supportedViewItems, SupportedViewItem{
			Name:     repo.FullName,
			GithubID: repo.RepositoryID,
		})
	}

	sort.Slice(supportedViewItems, func(i, j int) bool {
		return supportedViewItems[i].Name < supportedViewItems[j].Name
	})

	return supportedViewItems, nil
}

func (api *API) updateIsAddedForSupportedViews(db *mongo.Database, userID primitive.ObjectID, supportedViews *[]SupportedView) error {
	if supportedViews == nil {
		return errors.New("supportedViews must not be nil")
	}
	for _, supportedView := range *supportedViews {
		for index, view := range supportedView.Views {
			addedView, err := api.getViewFromSupportedView(db, userID, supportedView.Type, view)
			if err != nil {
				return err
			}
			supportedView.Views[index].IsAdded = addedView != nil
			if addedView != nil {
				supportedView.Views[index].ViewID = addedView.ID
			}
		}
	}
	return nil
}

func (api *API) getViewFromSupportedView(db *mongo.Database, userID primitive.ObjectID, viewType constants.ViewType, view SupportedViewItem) (*database.View, error) {
	if viewType == constants.ViewTaskSection {
		return api.getView(db, userID, viewType, &[]bson.M{
			{"task_section_id": view.TaskSectionID},
		})
	} else if viewType == constants.ViewLinear || viewType == constants.ViewSlack || viewType == constants.ViewMeetingPreparation || viewType == constants.ViewDueToday {
		return api.getView(db, userID, viewType, nil)
	} else if viewType == constants.ViewGithub {
		return api.getView(db, userID, viewType, &[]bson.M{
			{"github_id": view.GithubID},
		})
	}
	return nil, errors.New("invalid view type")
}

func (api *API) getView(db *mongo.Database, userID primitive.ObjectID, viewType constants.ViewType, additionalFilters *[]bson.M) (*database.View, error) {
	filter := bson.M{
		"$and": []bson.M{
			{"user_id": userID},
			{"type": string(viewType)},
		},
	}
	if additionalFilters != nil && len(*additionalFilters) > 0 {
		for _, additionalFilter := range *additionalFilters {
			filter["$and"] = append(filter["$and"].([]bson.M), additionalFilter)
		}
	}

	var view database.View
	err := database.GetViewCollection(db).FindOne(
		context.Background(),
		filter,
	).Decode(&view)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil // view has not been added
		} else {
			api.Logger.Error().Err(err).Msg("failed to check if view exists")
			return nil, err
		}
	}
	return &view, nil
}

func isValidGithubRepository(db *mongo.Database, userID primitive.ObjectID, repositoryID string) (bool, error) {
	repositoryCollection := database.GetRepositoryCollection(db)
	count, err := repositoryCollection.CountDocuments(context.Background(), bson.M{"user_id": userID, "repository_id": repositoryID})
	return count > 0, err
}
