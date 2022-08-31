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

func (generalTask GeneralTaskService) HandleLinkCallback(db *mongo.Database, params CallbackParams, userID primitive.ObjectID) error {
	return errors.New("general task service does not support linking")
}

func (generalTask GeneralTaskService) HandleSignupCallback(db *mongo.Database, params CallbackParams) (primitive.ObjectID, *bool, *string, error) {
	return primitive.NilObjectID, nil, nil, errors.New("general task service does not support signup")
}
