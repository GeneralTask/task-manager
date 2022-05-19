package constants

import "go.mongodb.org/mongo-driver/bson/primitive"

var IDTaskSectionPriority primitive.ObjectID = primitive.ObjectID{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0}
var IDTaskSectionDefault primitive.ObjectID = primitive.ObjectID{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1}
var IDTaskSectionBlocked primitive.ObjectID = primitive.ObjectID{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2}
var IDTaskSectionBacklog primitive.ObjectID = primitive.ObjectID{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3}
var IDTaskSectionDone primitive.ObjectID = primitive.ObjectID{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4}
