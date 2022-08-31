package external

import (
	"errors"
	"go.mongodb.org/mongo-driver/mongo"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

const GeneralTaskDefaultAccountID string = "default"

type GeneralTaskService struct{}

func (generalTask GeneralTaskService) GetLinkURL(stateTokenID primitive.ObjectID, userID primitive.ObjectID) (*string, error) {
	return nil, errors.New("general task service does not support linking")
}

func (generalTask GeneralTaskService) GetSignupURL(stateTokenID primitive.ObjectID, forcePrompt bool) (*string, error) {
	return nil, errors.New("general task service does not support signup")
}

func (generalTask GeneralTaskService) HandleLinkCallback(params CallbackParams, userID primitive.ObjectID, db *mongo.Database) error {
	return errors.New("general task service does not support linking")
}

func (generalTask GeneralTaskService) HandleSignupCallback(params CallbackParams, db *mongo.Database) (primitive.ObjectID, *bool, *string, error) {
	return primitive.NilObjectID, nil, nil, errors.New("general task service does not support signup")
}
