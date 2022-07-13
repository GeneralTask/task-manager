package api

import (
	"context"
	"errors"

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
	ViewTaskSection ViewType = "task_section"
	ViewLinear      ViewType = "linear"
)

type SourcesResult struct {
	Name             string  `json:"name"`
	AuthorizationURL *string `json:"authorization_url"`
}

type ViewItems interface {
	[]*TaskResult
}
type OverviewResult[T ViewItems] struct {
	ID            primitive.ObjectID `json:"id"`
	Name          string             `json:"name"`
	Type          ViewType           `json:"type"`
	Logo          string             `json:"logo"`
	IsLinked      bool               `json:"is_linked"`
	Sources       []SourcesResult    `json:"sources"`
	TaskSectionID primitive.ObjectID `json:"task_section_id"`
	IsReorderable bool               `json:"is_reorderable"`
	IDOrdering    int                `json:"ordering_id"`
	ViewItems     T                  `json:"view_items"`
}

func (api *API) OverviewViewsList(c *gin.Context) {
	parentCtx := c.Request.Context()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
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
		} else {
			return nil, errors.New("invalid view type")
		}
	}
	return result, nil
}

func (api *API) GetTaskSectionOverviewResult(db *mongo.Database, ctx context.Context, view database.View, userID primitive.ObjectID) (*OverviewResult[[]*TaskResult], error) {
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

	var taskResults []*TaskResult
	for _, task := range *tasks {
		taskResults = append(taskResults, api.taskBaseToTaskResult(&task, userID))
	}
	return &OverviewResult[[]*TaskResult]{
		ID:            view.ID,
		Name:          name,
		Logo:          external.TaskServiceGeneralTask.LogoV2,
		Type:          ViewTaskSection,
		IsLinked:      view.IsLinked,
		TaskSectionID: view.TaskSectionID,
		IsReorderable: view.IsReorderable,
		IDOrdering:    view.IDOrdering,
		ViewItems:     taskResults,
	}, nil
}

func (api *API) IsServiceLinked(db *mongo.Database, ctx context.Context, userID primitive.ObjectID, serviceID string) (bool, error) {
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
		}
		dbCtx, cancel := context.WithTimeout(ctx, constants.DatabaseTimeout)
		defer cancel()
		isLinked, err := api.IsServiceLinked(db, dbCtx, userID, serviceID)
		if err != nil {
			api.Logger.Error().Err(err).Msg("failed to check if service is linked")
			return err
		}
		// If view is linked but service does not exist, update view to unlinked
		if view.IsLinked && !isLinked {
			_, err := database.GetViewCollection(db).UpdateOne(
				dbCtx,
				bson.M{"_id": view.ID},
				bson.M{"$set": bson.M{"is_linked": false}},
			)
			if err != nil {
				api.Logger.Error().Err(err).Msg("failed to update view")
				return err
			}
			(*views)[index].IsLinked = false
		} else if !view.IsLinked && isLinked {
			// If view is unlinked but service does exist, update view to linked
			_, err := database.GetViewCollection(db).UpdateOne(
				dbCtx,
				bson.M{"_id": view.ID},
				bson.M{"$set": bson.M{"is_linked": true}},
			)
			if err != nil {
				api.Logger.Error().Err(err).Msg("failed to update view")
				return err
			}
			(*views)[index].IsLinked = true
		}
	}
	return nil
}

func (api *API) GetLinearOverviewResult(db *mongo.Database, ctx context.Context, view database.View, userID primitive.ObjectID) (*OverviewResult[[]*TaskResult], error) {
	if view.UserID != userID {
		return nil, errors.New("invalid user")
	}
	if !view.IsLinked {
		return &OverviewResult[[]*TaskResult]{
			ID:            view.ID,
			Name:          "Linear",
			Logo:          external.TaskServiceLinear.LogoV2,
			Type:          ViewLinear,
			IsLinked:      view.IsLinked,
			TaskSectionID: view.TaskSectionID,
			IsReorderable: view.IsReorderable,
			IDOrdering:    view.IDOrdering,
			ViewItems:     []*TaskResult{},
		}, nil
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
	return &OverviewResult[[]*TaskResult]{
		ID:            view.ID,
		Name:          "Linear",
		Logo:          external.TaskServiceLinear.LogoV2,
		Type:          ViewLinear,
		IsLinked:      view.IsLinked,
		TaskSectionID: primitive.NilObjectID,
		IsReorderable: view.IsReorderable,
		IDOrdering:    view.IDOrdering,
		ViewItems:     taskResults,
	}, nil
}

func (api *API) OverviewViewAdd(c *gin.Context) {
	c.JSON(200, nil)
}

func (api *API) OverviewViewModify(c *gin.Context) {
	c.JSON(200, nil)
}
