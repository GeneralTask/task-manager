package api

import (
	"context"

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
	TaskSectionId *primitive.ObjectID `json:"task_section_id"`
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

	userID, _ := c.Get("user")
	var userObject database.User
	userCollection := database.GetUserCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = userCollection.FindOne(dbCtx, bson.M{"_id": userID}).Decode(&userObject)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to find user")
		Handle500(c)
		return
	}

	cursor, err := database.GetViewCollection(db).Find(
		dbCtx,
		bson.M{
			"user_id": userID.(primitive.ObjectID),
		},
	)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to find views")
		Handle500(c)
		return
	}
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	var views []database.View
	err = cursor.All(dbCtx, &views)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to find views")
		Handle500(c)
		return
	}

	var overviewResults []*OverviewResult

	for _, view := range views {
		overviewResults = append(overviewResults, api.getOverviewResult(parentCtx, view, userID.(primitive.ObjectID)))
	}

	c.JSON(200, overviewResults)
}

func (api *API) getOverviewResult(ctx context.Context, view database.View, userID primitive.ObjectID) *OverviewResult {
	if view.Type == "task_section" {
		result, err := api.getTaskSectionOverviewResult(ctx, view, userID)
		if err != nil {
			api.Logger.Error().Err(err).Msg("failed to get task section overview result")
			return nil
		}
		return result
	}
	return nil
}

func (api *API) getTaskSectionOverviewResult(ctx context.Context, view database.View, userID primitive.ObjectID) (*OverviewResult, error) {
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
	_ = cursor.All(dbCtx, &tasks)

	var taskResults []*TaskResult
	for _, task := range tasks {
		taskResults = append(taskResults, api.taskBaseToTaskResult(&task, userID))
	}

	name, _ := database.GetTaskSectionName(db, view.TaskSectionID)
	return &OverviewResult{
		ID:            view.ID,
		Name:          name,
		Logo:		   "generaltask",
		Type:          ViewTaskSection,
		IsLinked:      view.IsLinked,
		TaskSectionId: &view.TaskSectionID,
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
