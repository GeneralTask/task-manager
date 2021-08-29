package external

import "go.mongodb.org/mongo-driver/bson/primitive"

type TaskService interface {
	GetLinkURL(stateTokenID primitive.ObjectID, userID primitive.ObjectID) (*string, error)
	GetSignupURL(stateTokenID primitive.ObjectID, forcePrompt bool) (*string, error)
	HandleLinkCallback(code string, userID primitive.ObjectID) error
	HandleSignupCallback(code string) (primitive.ObjectID, *string, error)
}
