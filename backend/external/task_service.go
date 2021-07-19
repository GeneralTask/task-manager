package external

import "go.mongodb.org/mongo-driver/bson/primitive"

type TaskService interface {
	GetLinkAuthURL(userID primitive.ObjectID) (string, error)
	HandleAuthCallback(code string, stateTokenID primitive.ObjectID, userID primitive.ObjectID) error
	GetLogoPath() string
	GetName() string
}
