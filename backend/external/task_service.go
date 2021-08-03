package external

import "go.mongodb.org/mongo-driver/bson/primitive"

type TaskService interface {
	GetLinkURL(userID primitive.ObjectID) (string, error)
	GetSignupURL(userID primitive.ObjectID) (string, error)
	HandleLinkCallback(code string, stateTokenID primitive.ObjectID, userID primitive.ObjectID) error
	HandleSignupCallback(code string, stateTokenID primitive.ObjectID, userID primitive.ObjectID) error
}
