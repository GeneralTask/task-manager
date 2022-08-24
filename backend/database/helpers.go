package database

import (
	"context"
	"errors"
	"time"

	"github.com/chidiwilliams/flatbson"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/logging"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func UpdateOrCreateTask(
	db *mongo.Database,
	userID primitive.ObjectID,
	IDExternal string,
	sourceID string,
	fieldsToInsertIfMissing interface{},
	fieldsToUpdate interface{},
	additionalFilters *[]bson.M,
) (*Task, error) {
	taskCollection := GetTaskCollection(db)
	logger := logging.GetSentryLogger()

	mongoResult, err := FindOneAndUpdateWithCollection(taskCollection, userID, IDExternal, sourceID, fieldsToInsertIfMissing, fieldsToUpdate, additionalFilters)
	if err != nil {
		return nil, err
	}

	var task Task
	err = mongoResult.Decode(&task)
	if err != nil {
		logger.Error().Err(err).Msg("failed to update or create task")
		return nil, err
	}
	return &task, nil
}

func UpdateOrCreateCalendarEvent(
	db *mongo.Database,
	userID primitive.ObjectID,
	IDExternal string,
	sourceID string,
	fields interface{},
	additionalFilters *[]bson.M,
) (*CalendarEvent, error) {
	eventCollection := GetCalendarEventCollection(db)
	mongoResult, err := FindOneAndUpdateWithCollection(eventCollection, userID, IDExternal, sourceID, nil, fields, additionalFilters)
	if err != nil {
		return nil, err
	}

	var event CalendarEvent
	err = mongoResult.Decode(&event)
	if err != nil {
		logger := logging.GetSentryLogger()
		logger.Error().Err(err).Msg("failed to update or create event")
		return nil, err
	}
	return &event, nil
}

func UpdateOrCreatePullRequest(
	db *mongo.Database,
	userID primitive.ObjectID,
	IDExternal string,
	sourceID string,
	fields interface{},
	additionalFilters *[]bson.M,
) (*PullRequest, error) {
	pullRequestCollection := GetPullRequestCollection(db)
	mongoResult, err := FindOneAndUpdateWithCollection(pullRequestCollection, userID, IDExternal, sourceID, nil, fields, additionalFilters)
	if err != nil {
		return nil, err
	}

	var pullRequest PullRequest
	err = mongoResult.Decode(&pullRequest)
	if err != nil {
		logger := logging.GetSentryLogger()
		logger.Error().Err(err).Msg("failed to update or create pull request")
		return nil, err
	}
	return &pullRequest, nil
}

func FindOneAndUpdateWithCollection(
	collection *mongo.Collection,
	userID primitive.ObjectID,
	IDExternal string,
	sourceID string,
	fieldsToInsertIfMissing interface{},
	fields interface{},
	additionalFilters *[]bson.M,
) (*mongo.SingleResult, error) {
	parentCtx := context.Background()
	dbQuery := getDBQuery(userID, IDExternal, sourceID, additionalFilters)
	// Unfortunately you cannot put both $set and $setOnInsert so they are separate operations
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()

	if fieldsToInsertIfMissing != nil {
		_, err := collection.UpdateOne(
			dbCtx,
			dbQuery,
			bson.M{"$setOnInsert": fieldsToInsertIfMissing},
			options.Update().SetUpsert(true),
		)
		if err != nil {
			logger := logging.GetSentryLogger()
			logger.Error().Err(err).Msg("failed to update or create task")
			return nil, err
		}
	}

	mongoResult := collection.FindOneAndUpdate(
		dbCtx,
		dbQuery,
		bson.M{"$set": fields},
		options.FindOneAndUpdate().SetUpsert(true).SetReturnDocument(options.After),
	)

	return mongoResult, nil
}

func GetTask(ctx context.Context, itemID primitive.ObjectID, userID primitive.ObjectID) (*Task, error) {
	parentCtx := ctx
	db, dbCleanup, err := GetDBConnection()
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("failed to establish DB connection")
		return nil, err
	}
	defer dbCleanup()
	taskCollection := GetTaskCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	mongoResult := FindOneWithCollection(dbCtx, taskCollection, userID, itemID)

	var task Task
	defer cancel()
	err = mongoResult.Decode(&task)
	if err != nil {
		logger.Error().Err(err).Msgf("failed to get task: %+v", itemID)
		return nil, err
	}
	return &task, nil
}

func GetCalendarEvent(ctx context.Context, itemID primitive.ObjectID, userID primitive.ObjectID) (*CalendarEvent, error) {
	db, dbCleanup, err := GetDBConnection()
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("failed to establish DB connection")
		return nil, err
	}
	defer dbCleanup()
	eventCollection := GetCalendarEventCollection(db)
	mongoResult := FindOneWithCollection(ctx, eventCollection, userID, itemID)

	var event CalendarEvent
	err = mongoResult.Decode(&event)
	if err != nil {
		logger.Error().Err(err).Msgf("failed to get event: %+v", itemID)
		return nil, err
	}
	return &event, nil
}

func GetPullRequest(ctx context.Context, itemID primitive.ObjectID, userID primitive.ObjectID) (*PullRequest, error) {
	db, dbCleanup, err := GetDBConnection()
	logger := logging.GetSentryLogger()
	if err != nil {
		return nil, err
	}
	defer dbCleanup()
	pullRequestCollection := GetPullRequestCollection(db)
	mongoResult := FindOneWithCollection(ctx, pullRequestCollection, userID, itemID)

	var pullRequest PullRequest
	err = mongoResult.Decode(&pullRequest)
	if err != nil {
		logger.Error().Err(err).Msgf("failed to get pull request: %+v", itemID)
		return nil, err
	}
	return &pullRequest, nil
}

func FindOneWithCollection(
	ctx context.Context,
	collection *mongo.Collection,
	userID primitive.ObjectID,
	itemID primitive.ObjectID) *mongo.SingleResult {
	dbCtx, cancel := context.WithTimeout(ctx, constants.DatabaseTimeout)
	defer cancel()
	return collection.FindOne(
		dbCtx,
		bson.M{"$and": []bson.M{
			{"_id": itemID},
			{"user_id": userID},
		}})
}

func GetOrCreateTask(db *mongo.Database, userID primitive.ObjectID, IDExternal string, sourceID string, fieldsToInsertIfMissing interface{}) (*Task, error) {
	taskCollection := GetTaskCollection(db)
	mongoResult := GetOrCreateWithCollection(taskCollection, userID, IDExternal, sourceID, fieldsToInsertIfMissing)
	if mongoResult == nil {
		return nil, errors.New("unable to create task")
	}

	var task Task
	err := mongoResult.Decode(&task)
	if err != nil {
		logger := logging.GetSentryLogger()
		logger.Error().Err(err).Msg("failed to get task")
		return nil, err
	}

	return &task, nil
}

func GetOrCreateCalendarEvent(db *mongo.Database, userID primitive.ObjectID, IDExternal string, sourceID string, fieldsToInsertIfMissing interface{}) (*CalendarEvent, error) {
	eventCollection := GetCalendarEventCollection(db)
	mongoResult := GetOrCreateWithCollection(eventCollection, userID, IDExternal, sourceID, fieldsToInsertIfMissing)
	if mongoResult == nil {
		return nil, errors.New("unable to create event")
	}

	var event CalendarEvent
	err := mongoResult.Decode(&event)
	if err != nil {
		logger := logging.GetSentryLogger()
		logger.Error().Err(err).Msg("failed to get event")
		return nil, err
	}

	return &event, nil
}

func GetOrCreatePullRequest(db *mongo.Database, userID primitive.ObjectID, IDExternal string, sourceID string, fieldsToInsertIfMissing interface{}) (*PullRequest, error) {
	pullRequestCollection := GetPullRequestCollection(db)
	mongoResult := GetOrCreateWithCollection(pullRequestCollection, userID, IDExternal, sourceID, fieldsToInsertIfMissing)
	logger := logging.GetSentryLogger()

	if mongoResult == nil {
		logger.Error().Msg("unable to create pull request")
		return nil, errors.New("unable to create pull request")
	}

	var pullRequest PullRequest
	err := mongoResult.Decode(&pullRequest)
	if err != nil {
		logger.Error().Err(err).Msg("failed to get pull request")
		return nil, err
	}

	return &pullRequest, nil
}

func GetOrCreateWithCollection(
	collection *mongo.Collection,
	userID primitive.ObjectID,
	IDExternal string,
	sourceID string,
	fieldsToInsertIfMissing interface{}) *mongo.SingleResult {
	parentCtx := context.Background()
	dbQuery := getDBQuery(userID, IDExternal, sourceID, nil)

	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	_, err := collection.UpdateOne(
		dbCtx,
		dbQuery,
		bson.M{"$setOnInsert": fieldsToInsertIfMissing},
		options.Update().SetUpsert(true),
	)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("failed to get or create event")
		return nil
	}

	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	return collection.FindOne(
		dbCtx,
		dbQuery,
	)
}

func getDBQuery(userID primitive.ObjectID, IDExternal string, sourceID string, additionalFilters *[]bson.M) primitive.M {
	dbQuery := bson.M{
		"$and": []bson.M{
			{"id_external": IDExternal},
			{"source_id": sourceID},
			{"user_id": userID},
		},
	}
	if additionalFilters != nil && len(*additionalFilters) > 0 {
		for _, filter := range *additionalFilters {
			dbQuery["$and"] = append(dbQuery["$and"].([]bson.M), filter)
		}
	}
	return dbQuery
}

func GetActiveTasks(db *mongo.Database, userID primitive.ObjectID) (*[]Task, error) {
	parentCtx := context.Background()
	taskCollection := GetTaskCollection(db)
	cursor, err := GetActiveItemsWithCollection(taskCollection, userID)
	if err != nil {
		return nil, err
	}

	var tasks []Task
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = cursor.All(dbCtx, &tasks)
	if err != nil {
		logger := logging.GetSentryLogger()
		logger.Error().Err(err).Msg("failed to fetch tasks for user")
		return nil, err
	}
	return &tasks, nil
}

func GetActivePRs(db *mongo.Database, userID primitive.ObjectID) (*[]PullRequest, error) {
	parentCtx := context.Background()
	pullRequestCollection := GetPullRequestCollection(db)
	cursor, err := GetActiveItemsWithCollection(pullRequestCollection, userID)
	if err != nil {
		return nil, err
	}

	var pullRequests []PullRequest
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = cursor.All(dbCtx, &pullRequests)
	if err != nil {
		logger := logging.GetSentryLogger()
		logger.Error().Err(err).Msg("failed to fetch PRs for user")
		return nil, err
	}
	return &pullRequests, nil
}

func GetActiveItemsWithCollection(collection *mongo.Collection, userID primitive.ObjectID) (*mongo.Cursor, error) {
	parentCtx := context.Background()
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	cursor, err := collection.Find(
		dbCtx,
		bson.M{
			"$and": []bson.M{
				{"user_id": userID},
				{"is_completed": false},
			},
		},
	)
	if err != nil {
		logger := logging.GetSentryLogger()
		logger.Error().Err(err).Msg("Failed to fetch PRs for user")
		return nil, err
	}
	return cursor, nil
}

func GetTasks(db *mongo.Database, userID primitive.ObjectID, additionalFilters *[]bson.M) (*[]Task, error) {
	parentCtx := context.Background()
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()

	taskCollection := GetTaskCollection(db)
	cursor, err := GetItemsWithCollection(taskCollection, userID, additionalFilters, dbCtx)
	if err != nil {
		return nil, err
	}

	var tasks []Task
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = cursor.All(dbCtx, &tasks)
	if err != nil {
		logger := logging.GetSentryLogger()
		logger.Error().Err(err).Msg("Failed to fetch items for user")
		return nil, err
	}
	return &tasks, nil
}

// will add helpers once we refactor tasks collection
func GetPullRequests(db *mongo.Database, userID primitive.ObjectID, additionalFilters *[]bson.M) (*[]PullRequest, error) {
	parentCtx := context.Background()
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()

	pullRequestCollection := GetPullRequestCollection(db)
	cursor, err := GetItemsWithCollection(pullRequestCollection, userID, additionalFilters, dbCtx)
	if err != nil {
		return nil, err
	}

	var pullRequests []PullRequest
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = cursor.All(dbCtx, &pullRequests)
	if err != nil {
		logger := logging.GetSentryLogger()
		logger.Error().Err(err).Msg("failed to fetch pull requests for user")
		return nil, err
	}
	return &pullRequests, nil
}

func GetItemsWithCollection(collection *mongo.Collection, userID primitive.ObjectID, additionalFilters *[]bson.M, dbCtx context.Context) (*mongo.Cursor, error) {
	filter := bson.M{
		"$and": []bson.M{
			{"user_id": userID},
		},
	}
	if additionalFilters != nil && len(*additionalFilters) > 0 {
		for _, additionalFilter := range *additionalFilters {
			filter["$and"] = append(filter["$and"].([]bson.M), additionalFilter)
		}
	}
	cursor, err := collection.Find(
		dbCtx,
		filter,
	)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("Failed to fetch items for user")
		return nil, err
	}
	return cursor, nil
}

func GetCompletedTasks(db *mongo.Database, userID primitive.ObjectID) (*[]Task, error) {
	parentCtx := context.Background()

	findOptions := options.Find()
	findOptions.SetSort(bson.D{{Key: "completed_at", Value: -1}, {Key: "_id", Value: -1}})
	findOptions.SetLimit(int64(constants.MAX_COMPLETED_TASKS))

	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	cursor, err := GetTaskCollection(db).Find(
		dbCtx,
		bson.M{
			"$and": []bson.M{
				{"user_id": userID},
				{"is_completed": true},
			},
		},
		findOptions,
	)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("Failed to fetch tasks for user")
		return nil, err
	}
	var tasks []Task
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = cursor.All(dbCtx, &tasks)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to fetch tasks for user")
		return nil, err
	}
	return &tasks, nil
}

func GetTaskSectionName(db *mongo.Database, taskSectionID primitive.ObjectID, userID primitive.ObjectID) (string, error) {
	if taskSectionID == constants.IDTaskSectionDefault {
		return "Default", nil
	}

	parentCtx := context.Background()
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()

	var taskSection TaskSection
	err := GetTaskSectionCollection(db).FindOne(
		dbCtx,
		bson.M{
			"$and": []bson.M{
				{"_id": taskSectionID},
				{"user_id": userID},
			},
		},
	).Decode(&taskSection)

	return taskSection.Name, err
}

func GetTaskSections(db *mongo.Database, userID primitive.ObjectID) (*[]TaskSection, error) {
	parentCtx := context.Background()
	sectionCollection := GetTaskSectionCollection(db)

	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	cursor, err := sectionCollection.Find(
		dbCtx,
		bson.M{"user_id": userID},
	)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("failed to fetch sections for user")
		return nil, err
	}
	var sections []TaskSection
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = cursor.All(dbCtx, &sections)
	if err != nil {
		logger.Error().Err(err).Msg("failed to fetch sections for user")
		return nil, err
	}
	return &sections, nil
}

func MarkItemCompleteWithCollection(collection *mongo.Collection, itemID primitive.ObjectID) error {
	parentCtx := context.Background()
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	res, err := collection.UpdateOne(
		dbCtx,
		bson.M{"_id": itemID},
		bson.M{"$set": bson.M{
			"is_completed": true,
			"completed_at": primitive.NewDateTimeFromTime(time.Now()),
		}},
	)
	if err != nil {
		return err
	}
	if res.MatchedCount != 1 {
		return errors.New("did not find item to mark complete")
	}
	return nil
}

func GetUser(db *mongo.Database, userID primitive.ObjectID) (*User, error) {
	parentCtx := context.Background()
	var userObject User
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err := GetUserCollection(db).FindOne(
		dbCtx,
		bson.M{"_id": userID},
	).Decode(&userObject)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("failed to load user")
		return nil, err
	}
	return &userObject, nil
}

func CreateStateToken(db *mongo.Database, userID *primitive.ObjectID, useDeeplink bool) (*string, error) {
	parentCtx := context.Background()
	stateToken := &StateToken{UseDeeplink: useDeeplink}
	if userID != nil {
		stateToken.UserID = *userID
	}
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	cursor, err := GetStateTokenCollection(db).InsertOne(dbCtx, stateToken)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("failed to create new state token")
		return nil, err
	}
	stateTokenStr := cursor.InsertedID.(primitive.ObjectID).Hex()
	return &stateTokenStr, nil
}

func GetStateToken(db *mongo.Database, stateTokenID primitive.ObjectID, userID *primitive.ObjectID) (*StateToken, error) {
	parentCtx := context.Background()
	var query bson.M
	if userID == nil {
		query = bson.M{"_id": stateTokenID}
	} else {
		query = bson.M{"$and": []bson.M{{"user_id": *userID}, {"_id": stateTokenID}}}
	}
	var token StateToken
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err := GetStateTokenCollection(db).FindOne(dbCtx, query).Decode(&token)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("failed to get state token")
		return nil, err
	}
	return &token, nil
}

func DeleteStateToken(db *mongo.Database, stateTokenID primitive.ObjectID, userID *primitive.ObjectID) error {
	parentCtx := context.Background()
	var deletionQuery bson.M
	if userID == nil {
		deletionQuery = bson.M{"_id": stateTokenID}
	} else {
		deletionQuery = bson.M{"$and": []bson.M{{"user_id": *userID}, {"_id": stateTokenID}}}
	}
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	result, err := GetStateTokenCollection(db).DeleteOne(dbCtx, deletionQuery)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("Failed to delete state token")
		return err
	}
	if result.DeletedCount != 1 {
		return errors.New("invalid state token")
	}
	return nil
}

func InsertLogEvent(db *mongo.Database, userID primitive.ObjectID, eventType string) error {
	dbCtx, cancel := context.WithTimeout(context.Background(), constants.DatabaseTimeout)
	defer cancel()
	_, err := GetLogEventsCollection(db).InsertOne(dbCtx, &LogEvent{
		UserID:    userID,
		EventType: eventType,
		CreatedAt: primitive.NewDateTimeFromTime(time.Now()),
	})
	return err
}

func GetExternalToken(db *mongo.Database, externalID string, serviceID string) (*ExternalAPIToken, error) {
	parentCtx := context.Background()
	var externalAPIToken ExternalAPIToken
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err := GetExternalTokenCollection(db).FindOne(
		dbCtx,
		bson.M{
			"$and": []bson.M{
				{"service_id": serviceID},
				{"account_id": externalID},
			},
		},
	).Decode(&externalAPIToken)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("failed to load external api token")
		return nil, err
	}
	return &externalAPIToken, nil
}

func GetStateTokenCollection(db *mongo.Database) *mongo.Collection {
	return db.Collection("state_tokens")
}

func GetTaskCollection(db *mongo.Database) *mongo.Collection {
	return db.Collection("tasks")
}

func GetCalendarEventCollection(db *mongo.Database) *mongo.Collection {
	return db.Collection("calendar_events")
}

func GetViewCollection(db *mongo.Database) *mongo.Collection {
	return db.Collection("views")
}

func GetRepositoryCollection(db *mongo.Database) *mongo.Collection {
	return db.Collection("repositories")
}

func GetUserCollection(db *mongo.Database) *mongo.Collection {
	return db.Collection("users")
}

func GetExternalTokenCollection(db *mongo.Database) *mongo.Collection {
	return db.Collection("external_api_tokens")
}

func GetPullRequestCollection(db *mongo.Database) *mongo.Collection {
	return db.Collection("pull_requests")
}

func GetUserSettingsCollection(db *mongo.Database) *mongo.Collection {
	return db.Collection("user_settings")
}

func GetInternalTokenCollection(db *mongo.Database) *mongo.Collection {
	return db.Collection("internal_api_tokens")
}

func GetWaitlistCollection(db *mongo.Database) *mongo.Collection {
	return db.Collection("waitlist")
}

func GetOauth1RequestsSecretsCollection(db *mongo.Database) *mongo.Collection {
	return db.Collection("oauth1_request_secrets")
}

func GetLogEventsCollection(db *mongo.Database) *mongo.Collection {
	return db.Collection("log_events")
}

func GetFeedbackItemCollection(db *mongo.Database) *mongo.Collection {
	return db.Collection("feedback_items")
}

func GetTaskSectionCollection(db *mongo.Database) *mongo.Collection {
	return db.Collection("task_sections")
}

func IsValidPagination(pagination Pagination) bool {
	if pagination.Limit == nil || pagination.Page == nil {
		return false
	}
	return *pagination.Limit > 0 && *pagination.Page > 0
}

func FlattenStruct(s interface{}) (map[string]interface{}, error) {
	flattened, err := flatbson.Flatten(s)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msgf("Could not flatten %+v", s)
		return nil, err
	}
	return flattened, nil
}
