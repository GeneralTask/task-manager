package constants

import "go.mongodb.org/mongo-driver/bson/primitive"

type StarterView struct {
	Type          string             `json:"type"`
	TaskSectionID primitive.ObjectID `json:"task_section_id"`
	IsLinked      bool               `json:"is_linked"`
	IsPaginated   bool               `json:"is_paginated"`
	IsReorderable bool               `json:"is_reorderable"`
}

var StarterViews = []StarterView{
	{
		Type:          "task_section",
		TaskSectionID: IDTaskSectionDefault,
		IsLinked:      true,
		IsPaginated:   false,
		IsReorderable: true,
	},
}
