package database

import (
	"context"
	"errors"
	"time"

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

func GetTask(db *mongo.Database, ctx context.Context, itemID primitive.ObjectID, userID primitive.ObjectID) (*Task, error) {
	parentCtx := ctx
	logger := logging.GetSentryLogger()
	taskCollection := GetTaskCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	mongoResult := FindOneWithCollection(dbCtx, taskCollection, userID, itemID)

	var task Task
	defer cancel()
	err := mongoResult.Decode(&task)
	if err != nil {
		logger.Error().Err(err).Msgf("failed to get task: %+v", itemID)
		return nil, err
	}
	return &task, nil
}

func GetCalendarEvent(db *mongo.Database, ctx context.Context, itemID primitive.ObjectID, userID primitive.ObjectID) (*CalendarEvent, error) {
	logger := logging.GetSentryLogger()
	eventCollection := GetCalendarEventCollection(db)
	mongoResult := FindOneWithCollection(ctx, eventCollection, userID, itemID)

	var event CalendarEvent
	err := mongoResult.Decode(&event)
	if err != nil {
		logger.Error().Err(err).Msgf("failed to get event: %+v", itemID)
		return nil, err
	}
	return &event, nil
}

func GetPullRequestByExternalID(db *mongo.Database, ctx context.Context, externalID string, userID primitive.ObjectID) (*PullRequest, error) {
	logger := logging.GetSentryLogger()
	dbCtx, cancel := context.WithTimeout(ctx, constants.DatabaseTimeout)
	defer cancel()
	var pullRequest PullRequest

	err := FindOneExternalWithCollection(
		dbCtx,
		GetPullRequestCollection(db),
		userID,
		externalID,
	).Decode(&pullRequest)
	if err != nil {
		if err != mongo.ErrNoDocuments {
			logger.Error().Err(err).Msgf("failed to get pull request: %+v", externalID)
		}
		return nil, err
	}
	return &pullRequest, nil
}

func FindOneExternalWithCollection(
	ctx context.Context,
	collection *mongo.Collection,
	userID primitive.ObjectID,
	externalID string) *mongo.SingleResult {
	dbCtx, cancel := context.WithTimeout(ctx, constants.DatabaseTimeout)
	defer cancel()
	return collection.FindOne(
		dbCtx,
		bson.M{"$and": []bson.M{
			{"id_external": externalID},
			{"user_id": userID},
		}})
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
		logger.Error().Err(err).Msg("failed to fetch PRs for user")
		return nil, err
	}
	return cursor, nil
}

func GetTasks(db *mongo.Database, userID primitive.ObjectID, additionalFilters *[]bson.M) (*[]Task, error) {
	parentCtx := context.Background()
	var tasks []Task
	err := FindWithCollection(parentCtx, GetTaskCollection(db), userID, additionalFilters, &tasks)
	if err != nil {
		logger := logging.GetSentryLogger()
		logger.Error().Err(err).Msg("failed to fetch items for user")
		return nil, err
	}
	return &tasks, nil
}

// will add helpers once we refactor tasks collection
func GetPullRequests(db *mongo.Database, userID primitive.ObjectID, additionalFilters *[]bson.M) (*[]PullRequest, error) {
	parentCtx := context.Background()
	var pullRequests []PullRequest
	err := FindWithCollection(parentCtx, GetPullRequestCollection(db), userID, additionalFilters, &pullRequests)
	if err != nil {
		logger := logging.GetSentryLogger()
		logger.Error().Err(err).Msg("failed to fetch pull requests for user")
		return nil, err
	}
	return &pullRequests, nil
}

func FindWithCollection(parentCtx context.Context, collection *mongo.Collection, userID primitive.ObjectID, additionalFilters *[]bson.M, result interface{}) error {
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
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	cursor, err := collection.Find(
		dbCtx,
		filter,
	)
	if err != nil {
		return err
	}
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	return cursor.All(dbCtx, result)
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
		logger.Error().Err(err).Msg("failed to fetch tasks for user")
		return nil, err
	}
	var tasks []Task
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = cursor.All(dbCtx, &tasks)
	if err != nil {
		logger.Error().Err(err).Msg("failed to fetch tasks for user")
		return nil, err
	}
	return &tasks, nil
}

func GetMeetingPreparationTasks(db *mongo.Database, userID primitive.ObjectID) (*[]Task, error) {
	return GetTasks(db, userID,
		&[]bson.M{
			{"is_completed": false},
			{"is_meeting_preparation_task": true},
		},
	)
}

func GetTaskSectionName(db *mongo.Database, taskSectionID primitive.ObjectID, userID primitive.ObjectID) (string, error) {
	if taskSectionID == constants.IDTaskSectionDefault {
		return GetDefaultSectionName(db, userID), nil
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

// Get all events that start until the end of the day
func GetEventsUntilEndOfDay(extCtx context.Context, db *mongo.Database, userID primitive.ObjectID, currentTime time.Time) (*[]CalendarEvent, error) {
	timeEndOfDay := time.Date(currentTime.Year(), currentTime.Month(), currentTime.Day(), 23, 59, 59, 0, currentTime.Location())
	eventCollection := GetCalendarEventCollection(db)
	dbCtx, cancel := context.WithTimeout(extCtx, constants.DatabaseTimeout)
	defer cancel()
	cursor, err := eventCollection.Find(
		dbCtx,
		bson.M{
			"$and": []bson.M{
				{"user_id": userID},
				{"datetime_start": bson.M{"$gte": currentTime}},
				{"datetime_start": bson.M{"$lte": timeEndOfDay}},
				{"linked_task_id": bson.M{"$exists": false}},
			},
		})
	if err != nil {
		return nil, err
	}
	var events []CalendarEvent
	dbCtx, cancel = context.WithTimeout(extCtx, constants.DatabaseTimeout)
	defer cancel()
	err = cursor.All(dbCtx, &events)
	return &events, err
}

func GetTaskSections(db *mongo.Database, userID primitive.ObjectID) (*[]TaskSection, error) {
	parentCtx := context.Background()
	var sections []TaskSection
	err := FindWithCollection(
		parentCtx,
		GetTaskSectionCollection(db),
		userID,
		&[]bson.M{{"user_id": userID}},
		&sections,
	)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("failed to load task sections")
		return nil, err
	}
	return &sections, nil
}

func MarkCompleteWithCollection(collection *mongo.Collection, itemID primitive.ObjectID) error {
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

func GetGeneralTaskUserByName(db *mongo.Database, name string) (*User, error) {
	parentCtx := context.Background()
	var user User

	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	if err := GetUserCollection(db).FindOne(
		dbCtx,
		bson.M{"email": name + "@generaltask.com"}).Decode(&user); err != nil {
		return nil, err
	}
	return &user, nil
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
		logger.Error().Err(err).Msg("failed to delete state token")
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

func GetDefaultSectionName(db *mongo.Database, userID primitive.ObjectID) string {
	parentCtx := context.Background()
	defaultSectionCollection := GetDefaultSectionSettingsCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()

	var settings DefaultSectionSettings
	mongoResult := defaultSectionCollection.FindOne(
		dbCtx,
		bson.M{"$and": []bson.M{
			{"user_id": userID},
		}},
	)
	err := mongoResult.Decode(&settings)
	logger := logging.GetSentryLogger()
	if err != nil {
		if err != mongo.ErrNoDocuments {
			logger.Error().Err(err).Msg("failed to query default section settings")
		}
		return constants.TaskSectionNameDefault
	}
	if settings.NameOverride != "" {
		return settings.NameOverride
	} else {
		return constants.TaskSectionNameDefault
	}
}

type ReorderableSubmodel struct {
	ID         primitive.ObjectID `bson:"_id,omitempty"`
	IDOrdering int                `bson:"id_ordering"`
}

func AdjustOrderingIDsForCollection(collection *mongo.Collection, userID primitive.ObjectID, itemID primitive.ObjectID, orderingID int) error {
	parentCtx := context.Background()
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	_, err := collection.UpdateMany(
		dbCtx,
		bson.M{"$and": []bson.M{
			{"_id": bson.M{"$ne": itemID}},
			{"user_id": userID},
			{"id_ordering": bson.M{"$gte": orderingID}},
		}},
		bson.M{"$inc": bson.M{"id_ordering": 1}},
	)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("failed to modify view id_orderings")
		return err
	}

	// Normalize ordering IDs
	var items []ReorderableSubmodel
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()

	options := options.Find().SetSort(bson.M{"id_ordering": 1})
	cursor, err := collection.Find(dbCtx, bson.M{"user_id": userID}, options)
	if err != nil {
		logger.Error().Err(err).Msg("failed to get items")
		return err
	}
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = cursor.All(dbCtx, &items)
	if err != nil {
		logger.Error().Err(err).Msg("failed to get items")
		return err
	}

	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	for index, item := range items {
		newIDOrdering := index + 1
		if item.IDOrdering != newIDOrdering {
			collection.UpdateOne(
				dbCtx,
				bson.M{"$and": []bson.M{
					{"_id": item.ID},
					{"user_id": userID}},
				},
				bson.M{"$set": bson.M{"id_ordering": newIDOrdering}},
			)
		}
	}
	return nil
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

func GetDefaultSectionSettingsCollection(db *mongo.Database) *mongo.Collection {
	return db.Collection("default_section_settings")
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
