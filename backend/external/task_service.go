package external

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type TaskService interface {
	GetLinkURL(stateTokenID primitive.ObjectID, userID primitive.ObjectID) (*string, error)
	GetSignupURL(stateTokenID primitive.ObjectID, forcePrompt bool) (*string, error)
	HandleLinkCallback(params CallbackParams, userID primitive.ObjectID, db *mongo.Database) error
	HandleSignupCallback(params CallbackParams, db *mongo.Database) (primitive.ObjectID, *bool, *string, error)
}

type CallbackParams struct {
	Oauth1Token    *string
	Oauth1Verifier *string
	Oauth2Code     *string
}
