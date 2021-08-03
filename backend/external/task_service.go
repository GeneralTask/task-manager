package external

import "go.mongodb.org/mongo-driver/bson/primitive"

type TaskService interface {
	// TODO: update all these method signatures once refactor is finalized
	GetLinkURL(userID primitive.ObjectID) (*string, error)
	GetSignupURL(forcePrompt bool) (*string, error)
	HandleLinkCallback(code string) (primitive.ObjectID, error)
	HandleSignupCallback(code string, stateTokenID primitive.ObjectID, userID primitive.ObjectID) error
}
