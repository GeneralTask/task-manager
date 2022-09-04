package constants

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

var IDTaskSectionDefault primitive.ObjectID = primitive.ObjectID{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1}
var _IDTaskSectionBlocked primitive.ObjectID = primitive.ObjectID{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2} // Deprecate
var _IDTaskSectionBacklog primitive.ObjectID = primitive.ObjectID{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3} // Deprecate
var IDTaskSectionDone primitive.ObjectID = primitive.ObjectID{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4}

const (
	TaskSectionNameDefault string = "Default"
	TaskSectionNameDone    string = "Done"
)
