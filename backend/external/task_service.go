package external

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type TaskService interface {
	GetLinkURL(stateTokenID primitive.ObjectID, userID primitive.ObjectID) (*string, error)
	GetSignupURL(stateTokenID primitive.ObjectID, forcePrompt bool) (*string, error)
	HandleLinkCallback(db *mongo.Database, params CallbackParams, userID primitive.ObjectID) error
	HandleSignupCallback(db *mongo.Database, params CallbackParams) (primitive.ObjectID, *bool, *string, error)
}

type CallbackParams struct {
	Oauth1Token    *string
	Oauth1Verifier *string
	Oauth2Code     *string
}
