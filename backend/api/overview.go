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
)

type SourcesResult struct {
	Name             string  `json:"name"`
	AuthorizationURL *string `json:"authorization_url"`
}

type OverviewResult struct {
	ID            primitive.ObjectID  `json:"id"`
	Name          string              `json:"name"`
	Type          ViewType            `json:"type"`
	Logo          string              `json:"logo"`
	IsLinked      bool                `json:"is_linked"`
	Sources       []SourcesResult     `json:"sources"`
	TaskSectionID *primitive.ObjectID `json:"task_section_id"`
	IsPaginated   bool                `json:"is_paginated"`
	IsReorderable bool                `json:"is_reorderable"`
	IDOrdering    int                 `json:"ordering_id"`
	ViewItems     interface{}         `json:"view_items"`
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

	results, err := api.getOverviewResults(db, dbCtx, views, userID)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to load views with view items")
		Handle500(c)
		return
	}
	c.JSON(200, results)
}

func (api *API) getOverviewResults(db *mongo.Database, ctx context.Context, views []database.View, userID primitive.ObjectID) ([]*OverviewResult, error) {
	var overviewResults []*OverviewResult
	for _, view := range views {
		var result *OverviewResult
		var err error
		if view.Type == string(ViewTaskSection) {
			result, err = api.GetTaskSectionOverviewResult(db, ctx, view, userID)
		} else {
			err = errors.New("invalid view type")
			return nil, err
		}
		if err != nil {
			return nil, err
		}
		overviewResults = append(overviewResults, result)
	}
	return overviewResults, nil
}

func (api *API) GetTaskSectionOverviewResult(db *mongo.Database, ctx context.Context, view database.View, userID primitive.ObjectID) (*OverviewResult, error) {
	if view.UserID != userID {
		return nil, errors.New("invalid user")
	}
	name, err := database.GetTaskSectionName(db, view.TaskSectionID)
	if err != nil {
		return nil, err
	}

	tasks, err := database.GetItems(db, userID,
		&[]bson.M{
			{"user_id": userID},
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
	return &OverviewResult{
		ID:            view.ID,
		Name:          name,
		Logo:          external.TaskServiceGeneralTask.LogoV2,
		Type:          ViewTaskSection,
		IsLinked:      view.IsLinked,
		TaskSectionID: &view.TaskSectionID,
		IsPaginated:   view.IsPaginated,
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
