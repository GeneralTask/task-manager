package api

import (
	"github.com/gin-gonic/gin"
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
	ViewItems     []*TaskResult       `json:"view_items"`
}

func (api *API) OverviewViewsList(c *gin.Context) {
	c.JSON(200, []*OverviewResult{
		{
			ID:       primitive.NewObjectID(),
			Name:     "Tasks",
			Type:     ViewTaskSection,
			Logo:     "generaltask",
			IsLinked: false,
			Sources: []SourcesResult{
				{
					Name: "GeneralTask",
				},
			},
			IsPaginated:   false,
			IsReorderable: true,
			IDOrdering:    0,
			ViewItems: []*TaskResult{
				{
					ID:         primitive.NewObjectID(),
					IDOrdering: 1,
					Source: TaskSource{
						Name:          "Tasks",
						Logo:          "generaltask",
						IsCompletable: true,
						IsReplyable:   false,
					},
					Deeplink:       "https://shorturl.at/lpKMU",
					Title:          "Film total rickall",
					Body:           "Ooo wee look at this task body",
					Sender:         "Professor PB",
					DueDate:        "2020-01-01",
					TimeAllocation: 0,
					SentAt:         "2020-01-01",
					IsDone:         false,
				},
				{
					ID:         primitive.NewObjectID(),
					IDOrdering: 2,
					Source: TaskSource{
						Name:          "Tasks",
						Logo:          "generaltask",
						IsCompletable: true,
						IsReplyable:   false,
					},
					Deeplink:       "https://en.wikipedia.org/wiki/Battle_of_Waterloo",
					Title:          "Ban black cherry waterloo",
					Body:           "Have Scott follow through with this",
					Sender:         "Nolan",
					DueDate:        "2020-01-01",
					TimeAllocation: 0,
					SentAt:         "2020-01-01",
					IsDone:         false,
				},
				{
					ID:         primitive.NewObjectID(),
					IDOrdering: 3,
					Source: TaskSource{
						Name:          "Tasks",
						Logo:          "generaltask",
						IsCompletable: true,
						IsReplyable:   false,
					},
					Deeplink:       "https://www.generaltask.com/",
					Title:          "Task 3",
					Body:           "Wow look at this task body",
					Sender:         "Scott",
					DueDate:        "2020-01-01",
					TimeAllocation: 0,
					SentAt:         "2020-01-01",
					IsDone:         false,
				},
				{
					ID:         primitive.NewObjectID(),
					IDOrdering: 4,
					Source: TaskSource{
						Name:          "Tasks",
						Logo:          "generaltask",
						IsCompletable: true,
						IsReplyable:   false,
					},
					Deeplink:       "https://www.generaltask.com/",
					Title:          "Task 4",
					Body:           "Wow look at this task body",
					Sender:         "Scott",
					DueDate:        "2020-01-01",
					TimeAllocation: 0,
					SentAt:         "2020-01-01",
					IsDone:         false,
				},
				{
					ID:         primitive.NewObjectID(),
					IDOrdering: 5,
					Source: TaskSource{
						Name:          "Tasks",
						Logo:          "generaltask",
						IsCompletable: true,
						IsReplyable:   false,
					},
					Deeplink:       "https://www.generaltask.com/",
					Title:          "Task 5",
					Body:           "Wow look at this task body",
					Sender:         "Jack",
					DueDate:        "2020-01-01",
					TimeAllocation: 0,
					SentAt:         "2020-01-01",
					IsDone:         false,
				},
			},
		},
	})
}

func (api *API) OverviewViewAdd(c *gin.Context) {
	c.JSON(200, nil)
}

func (api *API) OverviewViewModify(c *gin.Context) {
	c.JSON(200, nil)
}
