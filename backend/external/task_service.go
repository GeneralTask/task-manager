package external

import "go.mongodb.org/mongo-driver/bson/primitive"

type TaskService interface {
	GetLinkURL(userID primitive.ObjectID) (*string, error)
	GetSignupURL(forcePrompt bool) (*string, error)
	HandleLinkCallback(code string) (primitive.ObjectID, error)
	HandleSignupCallback(code string, stateTokenID primitive.ObjectID, userID primitive.ObjectID) error
}
