package api

import (
	"context"
	"errors"
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
	"go.mongodb.org/mongo-driver/mongo/options"
)

type ViewType string

const (
	ViewLinearName             = "Linear"
	ViewSlackName              = "Slack"
	ViewGithubName             = "Github"
	ViewMeetingPreparationName = "Meeting Preparation"
)

const (
	ViewTaskSection        ViewType = "task_section"
	ViewLinear             ViewType = "linear"
	ViewSlack              ViewType = "slack"
	ViewGithub             ViewType = "github"
	ViewMeetingPreparation ViewType = "meeting_preparation"
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
	Type          ViewType           `json:"type"`
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
	Type             ViewType            `json:"type"`
	Name             string              `json:"name"`
	Logo             string              `json:"logo"`
	IsNested         bool                `json:"is_nested"`
	IsLinked         bool                `json:"is_linked"`
	AuthorizationURL string              `json:"authorization_url"`
	Views            []SupportedViewItem `json:"views"`
}

func (api *API) OverviewViewsList(c *gin.Context) {
	parentCtx := c.Request.Context()

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

	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	cursor, err := database.GetViewCollection(api.DB).Find(
		dbCtx,
		bson.M{"user_id": userID},
	)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to find views")
		Handle500(c)
		return
	}

	var views []database.View
	err = cursor.All(dbCtx, &views)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to find views")
		Handle500(c)
		return
	}
	err = api.UpdateViewsLinkedStatus(api.DB, parentCtx, &views, userID)
	if err != nil {
		log.Print("failed to get views")

		api.Logger.Error().Err(err).Msg("failed to update views")
		Handle500(c)
		return
	}

	result, err := api.GetOverviewResults(api.DB, parentCtx, views, userID, timezoneOffset)
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

func (api *API) GetOverviewResults(db *mongo.Database, ctx context.Context, views []database.View, userID primitive.ObjectID, timezoneOffset time.Duration) ([]OrderingIDGetter, error) {
	result := []OrderingIDGetter{}
	for _, view := range views {
		var singleOverviewResult OrderingIDGetter
		var err error
		switch view.Type {
		case string(ViewTaskSection):
			singleOverviewResult, err = api.GetTaskSectionOverviewResult(db, ctx, view, userID)
		case string(ViewLinear):
			singleOverviewResult, err = api.GetLinearOverviewResult(db, ctx, view, userID)
		case string(ViewSlack):
			singleOverviewResult, err = api.GetSlackOverviewResult(db, ctx, view, userID)
		case string(ViewGithub):
			singleOverviewResult, err = api.GetGithubOverviewResult(db, ctx, view, userID)
		case string(ViewMeetingPreparation):
			singleOverviewResult, err = api.GetMeetingPreparationOverviewResult(db, ctx, view, userID, timezoneOffset)
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

func (api *API) GetTaskSectionOverviewResult(db *mongo.Database, ctx context.Context, view database.View, userID primitive.ObjectID) (*OverviewResult[TaskResult], error) {
	if view.UserID != userID {
		return nil, errors.New("invalid user")
	}
	name, err := database.GetTaskSectionName(db, view.TaskSectionID, userID)
	if err != nil {
		if err != mongo.ErrNoDocuments {
			return nil, err
		}
		dbCtx, cancel := context.WithTimeout(ctx, constants.DatabaseTimeout)
		defer cancel()
		_, err = database.GetViewCollection(db).DeleteOne(dbCtx, bson.M{"_id": view.ID})
		return nil, err
	}

	tasks, err := database.GetTasks(db, userID,
		&[]bson.M{
			{"is_completed": false},
			{"id_task_section": view.TaskSectionID},
		},
	)
	if err != nil {
		return nil, err
	}
	sort.Slice(*tasks, func(i, j int) bool {
		return (*tasks)[i].IDOrdering < (*tasks)[j].IDOrdering
	})

	// Reset ID orderings to begin at 1
	taskResults := []*TaskResult{}
	taskCollection := database.GetTaskCollection(db)
	orderingID := 1
	for _, task := range *tasks {
		if task.IDOrdering != orderingID {
			task.IDOrdering = orderingID
			dbCtx, cancel := context.WithTimeout(ctx, constants.DatabaseTimeout)
			defer cancel()
			res, err := taskCollection.UpdateOne(
				dbCtx,
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
		taskResults = append(taskResults, api.taskBaseToTaskResult(&task, userID))
	}
	return &OverviewResult[TaskResult]{
		ID:            view.ID,
		Name:          name,
		Logo:          external.TaskServiceGeneralTask.LogoV2,
		Type:          ViewTaskSection,
		IsLinked:      view.IsLinked,
		Sources:       []SourcesResult{},
		TaskSectionID: view.TaskSectionID,
		IsReorderable: view.IsReorderable,
		IDOrdering:    view.IDOrdering,
		ViewItems:     taskResults,
	}, nil
}

func (api *API) IsServiceLinked(db *mongo.Database, ctx context.Context, userID primitive.ObjectID, serviceID string) (bool, error) {
	if serviceID == external.TASK_SERVICE_ID_GT {
		return true, nil
	}
	externalAPITokenCollection := database.GetExternalTokenCollection(db)
	dbCtx, cancel := context.WithTimeout(ctx, constants.DatabaseTimeout)
	defer cancel()
	count, err := externalAPITokenCollection.CountDocuments(
		dbCtx,
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

func (api *API) UpdateViewsLinkedStatus(db *mongo.Database, ctx context.Context, views *[]database.View, userID primitive.ObjectID) error {
	for index, view := range *views {
		if view.UserID != userID {
			return errors.New("invalid user")
		}
		var serviceID string
		if view.Type == string(ViewTaskSection) {
			continue
		} else if view.Type == string(ViewLinear) {
			serviceID = external.TaskServiceLinear.ID
		} else if view.Type == string(ViewSlack) {
			serviceID = external.TaskServiceSlack.ID
		} else if view.Type == string(ViewGithub) {
			serviceID = external.TaskServiceGithub.ID
		} else if view.Type == string(ViewMeetingPreparation) {
			continue
		} else {
			return errors.New("invalid view type")
		}
		dbCtx, cancel := context.WithTimeout(ctx, constants.DatabaseTimeout)
		defer cancel()
		isLinked, err := api.IsServiceLinked(db, dbCtx, userID, serviceID)
		if err != nil {
			api.Logger.Error().Err(err).Msg("failed to check if service is linked")
			return err
		}
		// If view is linked but service does not exist, update view to unlinked and vice versa
		if view.IsLinked != isLinked {
			_, err := database.GetViewCollection(db).UpdateOne(
				dbCtx,
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

func (api *API) GetLinearOverviewResult(db *mongo.Database, ctx context.Context, view database.View, userID primitive.ObjectID) (*OverviewResult[TaskResult], error) {
	if view.UserID != userID {
		return nil, errors.New("invalid user")
	}
	authURL := config.GetAuthorizationURL(external.TASK_SERVICE_ID_LINEAR)
	result := OverviewResult[TaskResult]{
		ID:       view.ID,
		Name:     ViewLinearName,
		Logo:     external.TaskServiceLinear.LogoV2,
		Type:     ViewLinear,
		IsLinked: view.IsLinked,
		Sources: []SourcesResult{
			{
				Name:             ViewLinearName,
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

	linearTasks, err := database.GetTasks(db, userID,
		&[]bson.M{
			{"is_completed": false},
			{"source_id": external.TASK_SOURCE_ID_LINEAR},
		},
	)
	if err != nil {
		return nil, err
	}
	taskResults := []*TaskResult{}
	for _, task := range *linearTasks {
		taskResults = append(taskResults, api.taskBaseToTaskResult(&task, userID))
	}
	result.IsLinked = view.IsLinked
	result.ViewItems = taskResults
	return &result, nil
}

func (api *API) GetSlackOverviewResult(db *mongo.Database, ctx context.Context, view database.View, userID primitive.ObjectID) (*OverviewResult[TaskResult], error) {
	if view.UserID != userID {
		return nil, errors.New("invalid user")
	}
	authURL := config.GetAuthorizationURL(external.TASK_SERVICE_ID_SLACK)
	result := OverviewResult[TaskResult]{
		ID:       view.ID,
		Name:     ViewSlackName,
		Logo:     external.TaskServiceSlack.LogoV2,
		Type:     ViewSlack,
		IsLinked: view.IsLinked,
		Sources: []SourcesResult{
			{
				Name:             ViewSlackName,
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

	slackTasks, err := database.GetTasks(db, userID,
		&[]bson.M{
			{"is_completed": false},
			{"source_id": external.TASK_SOURCE_ID_SLACK_SAVED},
		},
	)
	if err != nil {
		return nil, err
	}
	taskResults := []*TaskResult{}
	for _, task := range *slackTasks {
		taskResults = append(taskResults, api.taskBaseToTaskResult(&task, userID))
	}
	result.IsLinked = view.IsLinked
	result.ViewItems = taskResults
	return &result, nil
}

func (api *API) GetGithubOverviewResult(db *mongo.Database, ctx context.Context, view database.View, userID primitive.ObjectID) (*OverviewResult[PullRequestResult], error) {
	if view.UserID != userID {
		return nil, errors.New("invalid user")
	}
	authURL := config.GetAuthorizationURL(external.TASK_SERVICE_ID_GITHUB)
	repositoryCollection := database.GetRepositoryCollection(db)
	var repository database.Repository
	err := repositoryCollection.FindOne(ctx, bson.M{"repository_id": view.GithubID}).Decode(&repository)
	if err != nil {
		return nil, err
	}

	result := OverviewResult[PullRequestResult]{
		ID:       view.ID,
		Name:     repository.FullName,
		Logo:     external.TaskServiceGithub.LogoV2,
		Type:     ViewGithub,
		IsLinked: view.IsLinked,
		Sources: []SourcesResult{
			{
				Name:             ViewGithubName,
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

	githubPRs, err := database.GetPullRequests(db, userID,
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
		pullRequestResult := PullRequestResult{
			ID:     pullRequest.ID.Hex(),
			Title:  pullRequest.Title,
			Number: pullRequest.Number,
			Status: PullRequestStatus{
				Text:  pullRequest.RequiredAction,
				Color: getColorFromRequiredAction(pullRequest.RequiredAction),
			},
			Author:        pullRequest.Author,
			NumComments:   pullRequest.CommentCount,
			CreatedAt:     pullRequest.CreatedAtExternal.Time().Format(time.RFC3339),
			Branch:        pullRequest.Branch,
			Deeplink:      pullRequest.Deeplink,
			LastUpdatedAt: pullRequest.LastUpdatedAt.Time().UTC().Format(time.RFC3339),
		}
		pullResults = append(pullResults, &pullRequestResult)
	}
	api.sortPullRequestResults(pullResults)
	result.ViewItems = pullResults
	return &result, nil
}

func (api *API) GetMeetingPreparationOverviewResult(db *mongo.Database, ctx context.Context, view database.View, userID primitive.ObjectID, timezoneOffset time.Duration) (*OverviewResult[TaskResult], error) {
	if view.UserID != userID {
		return nil, errors.New("invalid user")
	}
	localZone := time.FixedZone("", int(-1*timezoneOffset.Seconds()))
	timeNow := api.GetCurrentTime().In(localZone)
	events, err := database.GetEventsUntilEndOfDay(ctx, db, userID, timeNow)
	if err != nil {
		return nil, err
	}

	// Create new meeting prep tasks for events. Ignore events if meeting prep task already exists
	err = CreateMeetingTasksFromEvents(ctx, db, userID, events)
	if err != nil {
		return nil, err
	}

	// Get all meeting prep tasks for user
	meetingTasks, err := database.GetMeetingPreparationTasks(db, userID)
	if err != nil {
		return nil, err
	}

	// Sort by datetime_start
	sort.Slice(*meetingTasks, func(i, j int) bool {
		return (*meetingTasks)[i].MeetingPreparationParams.DatetimeStart <= (*meetingTasks)[j].MeetingPreparationParams.DatetimeStart
	})

	// Create result of meeting prep tasks
	result, err := api.GetMeetingPrepTaskResult(ctx, db, userID, timeNow, meetingTasks)
	if err != nil {
		return nil, err
	}

	return &OverviewResult[TaskResult]{
		ID:            view.ID,
		Name:          ViewMeetingPreparationName,
		Logo:          external.TaskSourceGoogleCalendar.LogoV2,
		Type:          ViewMeetingPreparation,
		IsLinked:      true,
		Sources:       []SourcesResult{},
		TaskSectionID: view.TaskSectionID,
		IsReorderable: view.IsReorderable,
		IDOrdering:    view.IDOrdering,
		ViewItems:     result,
	}, nil
}

func CreateMeetingTasksFromEvents(ctx context.Context, db *mongo.Database, userID primitive.ObjectID, events *[]database.CalendarEvent) error {
	taskCollection := database.GetTaskCollection(db)
	for _, event := range *events {
		dbCtx, cancel := context.WithTimeout(ctx, constants.DatabaseTimeout)
		defer cancel()
		// Check if meeting prep task exists
		count, err := taskCollection.CountDocuments(
			dbCtx,
			bson.M{"$and": []bson.M{
				{"user_id": userID},
				{"is_meeting_preparation_task": true},
				{"meeting_preparation_params.id_external": event.IDExternal},
				{"source_id": event.SourceID},
			},
			})
		if err != nil {
			return err
		}
		// Create meeting prep task for event if one does not exist
		if count > 0 {
			continue
		}
		isCompleted := false
		_, err = taskCollection.InsertOne(ctx, database.Task{
			Title:                    &event.Title,
			Body:                     &event.Body,
			UserID:                   userID,
			IsCompleted:              &isCompleted,
			SourceID:                 event.SourceID,
			IsMeetingPreparationTask: true,
			MeetingPreparationParams: database.MeetingPreparationParams{
				CalendarEventID:               event.ID,
				IDExternal:                    event.IDExternal,
				DatetimeStart:                 event.DatetimeStart,
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
func (api *API) GetMeetingPrepTaskResult(ctx context.Context, db *mongo.Database, userID primitive.ObjectID, expirationTime time.Time, tasks *[]database.Task) ([]*TaskResult, error) {
	taskCollection := database.GetTaskCollection(db)
	result := []*TaskResult{}
	for _, task := range *tasks {
		// if meeting has ended, mark task as complete
		if task.MeetingPreparationParams.DatetimeEnd.Time().After(expirationTime) && !task.MeetingPreparationParams.HasBeenAutomaticallyCompleted {
			dbCtx, cancel := context.WithTimeout(ctx, constants.DatabaseTimeout)
			defer cancel()
			_, err := taskCollection.UpdateOne(
				dbCtx,
				bson.M{"$and": []bson.M{
					{"_id": task.ID},
					{"user_id": userID},
				}},
				bson.M{"$set": bson.M{"is_completed": true, "meeting_preparation_params.has_been_automatically_completed": true}})
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
	parentCtx := c.Request.Context()
	var viewCreateParams ViewCreateParams
	err := c.BindJSON(&viewCreateParams)
	if err != nil {
		c.JSON(400, gin.H{"detail": "invalid or missing parameter"})
		return
	}
	if viewCreateParams.Type == string(ViewTaskSection) && viewCreateParams.TaskSectionID == nil {
		c.JSON(400, gin.H{"detail": "'task_section_id' is required for task section type views"})
		return
	} else if viewCreateParams.Type == string(ViewGithub) && viewCreateParams.GithubID == nil {
		c.JSON(400, gin.H{"detail": "'id_github' is required for github type views"})
		return
	}

	userID := getUserIDFromContext(c)
	viewExists, err := api.ViewDoesExist(api.DB, parentCtx, userID, viewCreateParams)
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
	if viewCreateParams.Type == string(ViewTaskSection) {
		serviceID = external.TASK_SERVICE_ID_GT
		taskSectionID, err = getValidTaskSection(*viewCreateParams.TaskSectionID, userID, api.DB)
		if err != nil {
			c.JSON(400, gin.H{"detail": "'task_section_id' is not a valid ID"})
			return
		}
	} else if viewCreateParams.Type == string(ViewLinear) {
		serviceID = external.TASK_SERVICE_ID_LINEAR
	} else if viewCreateParams.Type == string(ViewGithub) {
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
	} else if viewCreateParams.Type != string(ViewLinear) && viewCreateParams.Type != string(ViewSlack) {
		c.JSON(400, gin.H{"detail": "unsupported 'type'"})
		return
	}
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()

	isLinked, err := api.IsServiceLinked(api.DB, dbCtx, userID, serviceID)
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
	insertedView, err := viewCollection.InsertOne(parentCtx, view)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to create view")
		Handle500(c)
		return
	}
	c.JSON(200, gin.H{
		"id": insertedView.InsertedID.(primitive.ObjectID).Hex(),
	})
}

func (api *API) ViewDoesExist(db *mongo.Database, ctx context.Context, userID primitive.ObjectID, params ViewCreateParams) (bool, error) {
	viewCollection := database.GetViewCollection(db)
	dbQuery := bson.M{
		"$and": []bson.M{
			{"user_id": userID},
			{"type": params.Type},
		},
	}
	if params.Type == string(ViewTaskSection) {
		if params.TaskSectionID == nil {
			return false, errors.New("'task_section_id' is required for task section type views")
		}
		taskSectionObjectID, err := primitive.ObjectIDFromHex(*params.TaskSectionID)
		if err != nil {
			return false, errors.New("'task_section_id' is not a valid ObjectID")
		}
		dbQuery["$and"] = append(dbQuery["$and"].([]bson.M), bson.M{"task_section_id": taskSectionObjectID})
	} else if params.Type == string(ViewGithub) {
		if params.GithubID == nil {
			return false, errors.New("'github_id' is required for github type views")
		}
		dbQuery["$and"] = append(dbQuery["$and"].([]bson.M), bson.M{"github_id": *params.GithubID})
	} else if params.Type != string(ViewLinear) && params.Type != string(ViewSlack) {
		return false, errors.New("unsupported view type")
	}
	count, err := viewCollection.CountDocuments(ctx, dbQuery)
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

	parentCtx := c.Request.Context()
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	viewCollection := database.GetViewCollection(api.DB)
	userID := getUserIDFromContext(c)
	result, err := viewCollection.UpdateOne(
		dbCtx,
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

	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	_, err = viewCollection.UpdateMany(
		dbCtx,
		bson.M{"$and": []bson.M{
			{"_id": bson.M{"$ne": viewID}},
			{"user_id": userID},
			{"id_ordering": bson.M{"$gte": viewModifyParams.IDOrdering}},
		}},
		bson.M{"$inc": bson.M{"id_ordering": 1}},
	)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to modify view id_orderings")
		Handle500(c)
		return
	}

	// Normalize ordering IDs
	var views []database.View
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()

	options := options.Find().SetSort(bson.M{"id_ordering": 1})
	cursor, err := viewCollection.Find(dbCtx, bson.M{"user_id": userID}, options)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to get views")
		Handle500(c)
		return
	}
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = cursor.All(dbCtx, &views)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to get views")
		Handle500(c)
		return
	}

	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	for index, view := range views {
		newIDOrdering := index + 1
		if view.IDOrdering != newIDOrdering {
			viewCollection.UpdateOne(
				dbCtx,
				bson.M{"$and": []bson.M{
					{"_id": view.ID},
					{"user_id": userID}},
				},
				bson.M{"$set": bson.M{"id_ordering": newIDOrdering}},
			)
		}
	}
	c.JSON(200, gin.H{})
}

func (api *API) OverviewViewDelete(c *gin.Context) {
	parentCtx := c.Request.Context()

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

	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	deleteResult, err := database.GetViewCollection(api.DB).DeleteOne(
		dbCtx,
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
	dbCtx, cancel := context.WithTimeout(c, constants.DatabaseTimeout)
	defer cancel()

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
	isGithubLinked, err := api.IsServiceLinked(api.DB, dbCtx, userID, external.TASK_SERVICE_ID_GITHUB)
	if err != nil {
		Handle500(c)
		return
	}
	isLinearLinked, err := api.IsServiceLinked(api.DB, dbCtx, userID, external.TASK_SERVICE_ID_LINEAR)
	if err != nil {
		Handle500(c)
		return
	}
	isSlackLinked, err := api.IsServiceLinked(api.DB, dbCtx, userID, external.TASK_SERVICE_ID_SLACK)
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
			Type:     ViewTaskSection,
			Name:     "Task Sections",
			Logo:     external.TaskServiceGeneralTask.LogoV2,
			IsNested: true,
			IsLinked: true,
			Views:    supportedTaskSectionViews,
		},
		{
			Type:             ViewLinear,
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
			Type:             ViewSlack,
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
			Type:             ViewGithub,
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

	supportedViewItems := []SupportedViewItem{{
		Name:          TaskSectionNameDefault,
		TaskSectionID: constants.IDTaskSectionDefault,
	}}
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
	dbCtx, cancel := context.WithTimeout(context.Background(), constants.DatabaseTimeout)
	defer cancel()
	var repositories []database.Repository
	cursor, err := repositoryCollection.Find(dbCtx, bson.M{"user_id": userID})
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to fetch repositories for user")
		return []SupportedViewItem{}, err
	}

	dbCtx, cancel = context.WithTimeout(context.Background(), constants.DatabaseTimeout)
	defer cancel()
	err = cursor.All(dbCtx, &repositories)
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

func (api *API) getViewFromSupportedView(db *mongo.Database, userID primitive.ObjectID, viewType ViewType, view SupportedViewItem) (*database.View, error) {
	if viewType == ViewTaskSection {
		return api.getView(db, userID, viewType, &[]bson.M{
			{"task_section_id": view.TaskSectionID},
		})
	} else if viewType == ViewLinear || viewType == ViewSlack {
		return api.getView(db, userID, viewType, nil)
	} else if viewType == ViewGithub {
		return api.getView(db, userID, viewType, &[]bson.M{
			{"github_id": view.GithubID},
		})
	}
	return nil, errors.New("invalid view type")
}

func (api *API) getView(db *mongo.Database, userID primitive.ObjectID, viewType ViewType, additionalFilters *[]bson.M) (*database.View, error) {
	parentCtx := context.Background()
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
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
		dbCtx,
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
	dbCtx, cancel := context.WithTimeout(context.Background(), constants.DatabaseTimeout)
	defer cancel()

	count, err := repositoryCollection.CountDocuments(dbCtx, bson.M{"user_id": userID, "repository_id": repositoryID})
	return count > 0, err
}
