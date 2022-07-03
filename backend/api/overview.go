package api

import (
	"context"
	"errors"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
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

	var overviewResults []*OverviewResult
	for _, view := range views {
		result, err := api.getOverviewResult(parentCtx, view, userID)
		if err != nil {
			api.Logger.Error().Err(err).Msg("failed to load view items in view")
			Handle500(c)
		}
		overviewResults = append(overviewResults, result)
	}
	c.JSON(200, overviewResults)
}

func (api *API) getOverviewResult(ctx context.Context, view database.View, userID primitive.ObjectID) (*OverviewResult, error) {
	if view.Type == "task_section" {
		return api.GetTaskSectionOverviewResult(ctx, view, userID)
	}
	return nil, errors.New("invalid view type")
}

func (api *API) GetTaskSectionOverviewResult(ctx context.Context, view database.View, userID primitive.ObjectID) (*OverviewResult, error) {
	if view.UserID != userID {
		return nil, errors.New("invalid user")
	}
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return nil, err
	}
	defer dbCleanup()

	parentCtx := context.Background()
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	cursor, _ := database.GetTaskCollection(db).Find(
		dbCtx,
		bson.M{
			"$and": []bson.M{
				{"user_id": userID},
				{"is_completed": false},
				{"task_type.is_task": true},
				{"id_task_section": view.TaskSectionID},
			},
		},
	)
	var tasks []database.Item
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = cursor.All(dbCtx, &tasks)
	if err != nil {
		return nil, err
	}

	var taskResults []*TaskResult
	for _, task := range tasks {
		taskResults = append(taskResults, api.taskBaseToTaskResult(&task, userID))
	}

	name, err := database.GetTaskSectionName(db, view.TaskSectionID)
	if err != nil {
		return nil, err
	}
	return &OverviewResult{
		ID:            view.ID,
		Name:          name,
		Logo:          "generaltask",
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
