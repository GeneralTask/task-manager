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
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type ViewType string

const (
	ViewLinearName = "Linear"
	ViewSlackName  = "Slack"
	ViewGithubName = "Github"
)

const (
	ViewTaskSection ViewType = "task_section"
	ViewLinear      ViewType = "linear"
	ViewSlack       ViewType = "slack"
	ViewGithub      ViewType = "github"
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
	MessagesID    primitive.ObjectID `json:"messages_id"`
	TaskSectionID primitive.ObjectID `json:"task_section_id"`
	GithubID      string             `json:"github_id"`
}

type SupportedView struct {
	Type     ViewType            `json:"type"`
	Name     string              `json:"name"`
	Logo     string              `json:"logo"`
	IsNested bool                `json:"is_nested"`
	Views    []SupportedViewItem `json:"views"`
}

func (api *API) OverviewViewsList(c *gin.Context) {
	parentCtx := c.Request.Context()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()

	userID := getUserIDFromContext(c)
	_, err = database.GetUser(db, userID)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to find user")
		Handle500(c)
		return
	}

	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	cursor, err := database.GetViewCollection(db).Find(
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
	err = api.UpdateViewsLinkedStatus(db, parentCtx, &views, userID)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to update views")
		Handle500(c)
		return
	}

	result, err := api.GetOverviewResults(db, parentCtx, views, userID)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to load views")
		Handle500(c)
		return
	}

	c.JSON(200, result)
}

func (api *API) GetOverviewResults(db *mongo.Database, ctx context.Context, views []database.View, userID primitive.ObjectID) ([]interface{}, error) {
	result := []interface{}{}
	for _, view := range views {
		if view.Type == string(ViewTaskSection) {
			overviewResult, err := api.GetTaskSectionOverviewResult(db, ctx, view, userID)
			if err != nil {
				return nil, err
			}
			result = append(result, overviewResult)
		} else if view.Type == string(ViewLinear) {
			overviewResult, err := api.GetLinearOverviewResult(db, ctx, view, userID)
			if err != nil {
				return nil, err
			}
			result = append(result, overviewResult)
		} else if view.Type == string(ViewSlack) {
			overviewResult, err := api.GetSlackOverviewResult(db, ctx, view, userID)
			if err != nil {
				return nil, err
			}
			result = append(result, overviewResult)
		} else if view.Type == string(ViewGithub) {
			overviewResult, err := api.GetGithubOverviewResult(db, ctx, view, userID)
			if err != nil {
				return nil, err
			}
			result = append(result, overviewResult)
		} else {
			return nil, errors.New("invalid view type")
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
		return nil, err
	}

	tasks, err := database.GetItems(db, userID,
		&[]bson.M{
			{"is_completed": false},
			{"task_type.is_task": true},
			{"id_task_section": view.TaskSectionID},
		},
	)
	if err != nil {
		return nil, err
	}

	taskResults := []*TaskResult{}
	for _, task := range *tasks {
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

	linearTasks, err := database.GetItems(db, userID,
		&[]bson.M{
			{"is_completed": false},
			{"task_type.is_task": true},
			{"source_id": external.TASK_SOURCE_ID_LINEAR},
		},
	)
	if err != nil {
		return nil, err
	}
	var taskResults []*TaskResult
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

	slackTasks, err := database.GetItems(db, userID,
		&[]bson.M{
			{"is_completed": false},
			{"task_type.is_task": true},
			{"source_id": external.TASK_SOURCE_ID_SLACK_SAVED},
		},
	)
	if err != nil {
		return nil, err
	}
	var taskResults []*TaskResult
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
	result := OverviewResult[PullRequestResult]{
		ID:       view.ID,
		Name:     ViewGithubName,
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

	githubPRs, err := database.GetItems(db, userID,
		&[]bson.M{
			{"is_completed": false},
			{"task_type.is_pull_request": true},
			{"pull_request.repository_id": view.GithubID},
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
			LastUpdatedAt: pullRequest.PullRequest.LastUpdatedAt.Time().UTC().Format(time.RFC3339),
		}
		pullResults = append(pullResults, &pullRequestResult)
	}
	result.ViewItems = pullResults
	return &result, nil
}

type ViewCreateParams struct {
	Type          string  `json:"type" binding:"required"`
	MessagesID    *string `json:"messages_id"`
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
		c.JSON(400, gin.H{"detail": "invalid or missing parameter"})
		return
	} else if viewCreateParams.Type == string(ViewGithub) && viewCreateParams.GithubID == nil {
		c.JSON(400, gin.H{"detail": "invalid or missing parameter"})
		return
	}

	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()

	userID := getUserIDFromContext(c)
	viewExists, err := api.ViewDoesExist(db, parentCtx, userID, viewCreateParams)
	if err != nil {
		Handle500(c)
		return
	}
	if viewExists {
		c.JSON(400, gin.H{"detail": "view already exists"})
		return
	}
	var serviceID string
	taskSectionID := primitive.NilObjectID
	if viewCreateParams.Type == string(ViewTaskSection) {
		serviceID = external.TASK_SERVICE_ID_GT
		if viewCreateParams.TaskSectionID == nil {
			c.JSON(400, gin.H{"detail": "'id_task_section' is required for task section type views"})
			return
		}
		taskSectionID, err = getValidTaskSection(*viewCreateParams.TaskSectionID, userID, db)
		if err != nil {
			c.JSON(400, gin.H{"detail": "'id_task_section' is not a valid ID"})
			return
		}
	} else if viewCreateParams.Type == string(ViewLinear) {
		serviceID = external.TASK_SERVICE_ID_LINEAR
	} else if viewCreateParams.Type != string(ViewLinear) {
		c.JSON(400, gin.H{"detail": "unsupported 'type'"})
		return
	}
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()

	isLinked, err := api.IsServiceLinked(db, dbCtx, userID, serviceID)
	if err != nil {
		Handle500(c)
		return
	}
	view := database.View{
		UserID:        userID,
		IDOrdering:    1,
		Type:          viewCreateParams.Type,
		IsLinked:      isLinked,
		TaskSectionID: taskSectionID,
	}

	viewCollection := database.GetViewCollection(db)
	_, err = viewCollection.InsertOne(parentCtx, view)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to create view")
		Handle500(c)
		return
	}
	c.JSON(200, gin.H{})
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
			return false, errors.New("'id_task_section' is required for task section type views")
		}
		dbQuery["$and"] = append(dbQuery["$and"].([]bson.M), bson.M{"task_section_id": *params.TaskSectionID})
	} else if params.Type == string(ViewGithub) {
		if params.GithubID == nil {
			return false, errors.New("'github_id' is required for github type views")
		}
		dbQuery["$and"] = append(dbQuery["$and"].([]bson.M), bson.M{"github_id": *params.GithubID})
	} else if params.Type != string(ViewLinear) && params.Type != string(ViewTaskSection) {
		return false, errors.New("unsupported view type")
	}
	count, err := viewCollection.CountDocuments(ctx, dbQuery)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (api *API) OverviewViewModify(c *gin.Context) {
	c.JSON(200, nil)
}

func (api *API) OverviewViewDelete(c *gin.Context) {
	parentCtx := c.Request.Context()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()

	userID := getUserIDFromContext(c)
	viewID, err := getViewIDFromContext(c)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to parse view id")
		Handle404(c)
		return
	}
	_, err = database.GetUser(db, userID)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to find user")
		Handle500(c)
		return
	}

	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	deleteResult, err := database.GetViewCollection(db).DeleteOne(
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
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()

	userID := getUserIDFromContext(c)
	supportedTaskSectionViews, err := api.getSupportedTaskSectionViews(db, userID)
	if err != nil {
		Handle500(c)
		return
	}
	supportedGithubViews, err := api.getSupportedGithubViews(db, userID)
	if err != nil {
		Handle500(c)
		return
	}
	supportedViews := []SupportedView{
		{
			Type:     ViewTaskSection,
			Name:     "Task Sections",
			Logo:     external.TaskServiceGeneralTask.LogoV2,
			IsNested: true,
			Views:    supportedTaskSectionViews,
		},
		{
			Type:     ViewLinear,
			Name:     "Linear",
			Logo:     "linear",
			IsNested: false,
			Views: []SupportedViewItem{
				{
					Name:    "Linear View",
					IsAdded: true,
				},
			},
		},
		{
			Type:     ViewSlack,
			Name:     "Slack",
			Logo:     "slack",
			IsNested: false,
			Views: []SupportedViewItem{
				{
					Name:    "Slack View",
					IsAdded: true,
				},
			},
		},
		{
			Type:     ViewGithub,
			Name:     "GitHub",
			Logo:     "github",
			IsNested: true,
			Views:    supportedGithubViews,
		},
	}
	err = api.updateIsAddedForSupportedViews(db, userID, &supportedViews)
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
	database.GetPullRequestCollection(db)
	pullRequests, err := database.GetItems(db, userID, &[]bson.M{{"task_type.is_pull_request": true}})
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to fetch pull requests for user")
		return []SupportedViewItem{}, err
	}
	repositoryIDToSupportedViewItems := map[string]SupportedViewItem{}
	for _, pullRequest := range *pullRequests {
		if err != nil {
			api.Logger.Error().Err(err).Msg("failed to parse pull request id")
			return []SupportedViewItem{}, err
		}
		repositoryIDToSupportedViewItems[pullRequest.RepositoryID] = SupportedViewItem{
			Name:     pullRequest.RepositoryName,
			GithubID: pullRequest.PullRequest.RepositoryID,
		}
	}
	supportedViewItems := []SupportedViewItem{}
	for _, supportedViewItem := range repositoryIDToSupportedViewItems {
		supportedViewItems = append(supportedViewItems, supportedViewItem)
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
			isAdded, err := api.viewIsAdded(db, userID, supportedView.Type, view)
			if err != nil {
				return err
			}
			supportedView.Views[index].IsAdded = isAdded
		}
	}
	return nil
}

func (api *API) viewIsAdded(db *mongo.Database, userID primitive.ObjectID, viewType ViewType, view SupportedViewItem) (bool, error) {
	if viewType == ViewTaskSection {
		return api.viewExists(db, userID, viewType, &[]bson.M{
			{"task_section_id": view.TaskSectionID},
		})
	} else if viewType == ViewLinear || viewType == ViewSlack {
		return api.viewExists(db, userID, viewType, nil)
	} else if viewType == ViewGithub {
		return api.viewExists(db, userID, viewType, &[]bson.M{
			{"github_id": view.GithubID},
		})
	}
	return false, errors.New("invalid view type")
}

func (api *API) viewExists(db *mongo.Database, userID primitive.ObjectID, viewType ViewType, additionalFilters *[]bson.M) (bool, error) {
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

	count, err := database.GetViewCollection(db).CountDocuments(
		dbCtx,
		filter,
	)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to check if view exists")
		return false, err
	}
	return count > int64(0), nil
}
