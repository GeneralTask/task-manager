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
	dbQuery := getDBQuery(userID, IDExternal, sourceID, additionalFilters)
	// Unfortunately you cannot put both $set and $setOnInsert so they are separate operations

	if fieldsToInsertIfMissing != nil {
		_, err := collection.UpdateOne(
			context.Background(),
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
		context.Background(),
		dbQuery,
		bson.M{"$set": fields},
		options.FindOneAndUpdate().SetUpsert(true).SetReturnDocument(options.After),
	)

	return mongoResult, nil
}

func GetTask(db *mongo.Database, itemID primitive.ObjectID, userID primitive.ObjectID) (*Task, error) {
	logger := logging.GetSentryLogger()
	taskCollection := GetTaskCollection(db)
	mongoResult := FindOneWithCollection(taskCollection, userID, itemID)

	var task Task
	err := mongoResult.Decode(&task)
	if err != nil {
		logger.Error().Err(err).Msgf("failed to get task: %+v", itemID)
		return nil, err
	}
	return &task, nil
}

func GetCalendarEvent(db *mongo.Database, itemID primitive.ObjectID, userID primitive.ObjectID) (*CalendarEvent, error) {
	logger := logging.GetSentryLogger()
	eventCollection := GetCalendarEventCollection(db)
	mongoResult := FindOneWithCollection(eventCollection, userID, itemID)

	var event CalendarEvent
	err := mongoResult.Decode(&event)
	if err != nil {
		logger.Error().Err(err).Msgf("failed to get event: %+v", itemID)
		return nil, err
	}
	return &event, nil
}

func GetPullRequestByExternalID(db *mongo.Database, externalID string, userID primitive.ObjectID) (*PullRequest, error) {
	logger := logging.GetSentryLogger()
	var pullRequest PullRequest

	err := FindOneExternalWithCollection(
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
	collection *mongo.Collection,
	userID primitive.ObjectID,
	externalID string) *mongo.SingleResult {
	return collection.FindOne(
		context.Background(),
		bson.M{"$and": []bson.M{
			{"id_external": externalID},
			{"user_id": userID},
		}})
}

func FindOneWithCollection(
	collection *mongo.Collection,
	userID primitive.ObjectID,
	itemID primitive.ObjectID) *mongo.SingleResult {
	return collection.FindOne(
		context.Background(),
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
	dbQuery := getDBQuery(userID, IDExternal, sourceID, nil)

	_, err := collection.UpdateOne(
		context.Background(),
		dbQuery,
		bson.M{"$setOnInsert": fieldsToInsertIfMissing},
		options.Update().SetUpsert(true),
	)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("failed to get or create event")
		return nil
	}

	return collection.FindOne(
		context.Background(),
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
	taskCollection := GetTaskCollection(db)
	cursor, err := GetActiveItemsWithCollection(taskCollection, userID)
	if err != nil {
		return nil, err
	}

	var tasks []Task
	err = cursor.All(context.Background(), &tasks)
	if err != nil {
		logger := logging.GetSentryLogger()
		logger.Error().Err(err).Msg("failed to fetch tasks for user")
		return nil, err
	}
	return &tasks, nil
}

func GetActivePRs(db *mongo.Database, userID primitive.ObjectID) (*[]PullRequest, error) {
	pullRequestCollection := GetPullRequestCollection(db)
	cursor, err := GetActiveItemsWithCollection(pullRequestCollection, userID)
	if err != nil {
		return nil, err
	}

	var pullRequests []PullRequest
	err = cursor.All(context.Background(), &pullRequests)
	if err != nil {
		logger := logging.GetSentryLogger()
		logger.Error().Err(err).Msg("failed to fetch PRs for user")
		return nil, err
	}
	return &pullRequests, nil
}

func GetActiveItemsWithCollection(collection *mongo.Collection, userID primitive.ObjectID) (*mongo.Cursor, error) {
	cursor, err := collection.Find(
		context.Background(),
		bson.M{
			"$and": []bson.M{
				{"user_id": userID},
				{"is_completed": false},
				{"is_deleted": bson.M{"$ne": true}},
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

func GetTasks(db *mongo.Database, userID primitive.ObjectID, additionalFilters *[]bson.M, findOptions *options.FindOptions) (*[]Task, error) {
	var tasks []Task
	err := FindWithCollection(GetTaskCollection(db), userID, additionalFilters, &tasks, findOptions)
	if err != nil {
		logger := logging.GetSentryLogger()
		logger.Error().Err(err).Msg("failed to fetch items for user")
		return nil, err
	}
	return &tasks, nil
}

// will add helpers once we refactor tasks collection
func GetPullRequests(db *mongo.Database, userID primitive.ObjectID, additionalFilters *[]bson.M) (*[]PullRequest, error) {
	var pullRequests []PullRequest
	err := FindWithCollection(GetPullRequestCollection(db), userID, additionalFilters, &pullRequests, nil)
	if err != nil {
		logger := logging.GetSentryLogger()
		logger.Error().Err(err).Msg("failed to fetch pull requests for user")
		return nil, err
	}
	return &pullRequests, nil
}

func FindWithCollection(collection *mongo.Collection, userID primitive.ObjectID, additionalFilters *[]bson.M, result interface{}, findOptions *options.FindOptions) error {
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
	if findOptions == nil {
		findOptions = options.Find()
	}

	cursor, err := collection.Find(
		context.Background(),
		filter,
		findOptions,
	)
	if err != nil {
		return err
	}
	return cursor.All(context.Background(), result)
}

func GetCompletedTasks(db *mongo.Database, userID primitive.ObjectID) (*[]Task, error) {
	findOptions := options.Find()
	findOptions.SetSort(bson.D{{Key: "completed_at", Value: -1}, {Key: "_id", Value: -1}})
	findOptions.SetLimit(int64(constants.MAX_COMPLETED_TASKS))

	cursor, err := GetTaskCollection(db).Find(
		context.Background(),
		bson.M{
			"$and": []bson.M{
				{"user_id": userID},
				{"is_completed": true},
				{"is_deleted": bson.M{"$ne": true}},
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
	err = cursor.All(context.Background(), &tasks)
	if err != nil {
		logger.Error().Err(err).Msg("failed to fetch tasks for user")
		return nil, err
	}
	return &tasks, nil
}

func GetDeletedTasks(db *mongo.Database, userID primitive.ObjectID) (*[]Task, error) {
	findOptions := options.Find()
	findOptions.SetSort(bson.D{{Key: "deleted_at", Value: -1}, {Key: "_id", Value: -1}})
	findOptions.SetLimit(int64(constants.MAX_DELETED_TASKS))
	filter := []bson.M{{"is_deleted": true}}

	tasks, err := GetTasks(db, userID, &filter, findOptions)
	if err != nil {
		logging.GetSentryLogger().Error().Err(err).Msg("failed to fetch deleted tasks for user")
		return nil, err
	}
	return tasks, nil
}

func GetMeetingPreparationTasks(db *mongo.Database, userID primitive.ObjectID) (*[]Task, error) {
	return GetTasks(db, userID,
		&[]bson.M{
			{"is_completed": false},
			{"is_meeting_preparation_task": true},
		},
		nil,
	)
}

func GetTaskSectionName(db *mongo.Database, taskSectionID primitive.ObjectID, userID primitive.ObjectID) (string, error) {
	if taskSectionID == constants.IDTaskSectionDefault {
		return GetDefaultSectionName(db, userID), nil
	}

	var taskSection TaskSection
	err := GetTaskSectionCollection(db).FindOne(
		context.Background(),
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
func GetEventsUntilEndOfDay(db *mongo.Database, userID primitive.ObjectID, currentTime time.Time) (*[]CalendarEvent, error) {
	timeEndOfDay := time.Date(currentTime.Year(), currentTime.Month(), currentTime.Day(), 23, 59, 59, 0, currentTime.Location())
	eventCollection := GetCalendarEventCollection(db)
	cursor, err := eventCollection.Find(
		context.Background(),
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
	err = cursor.All(context.Background(), &events)
	return &events, err
}

func GetTaskSections(db *mongo.Database, userID primitive.ObjectID) (*[]TaskSection, error) {
	var sections []TaskSection
	err := FindWithCollection(GetTaskSectionCollection(db), userID, &[]bson.M{{"user_id": userID}}, &sections, nil)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("failed to load task sections")
		return nil, err
	}
	return &sections, nil
}

func MarkCompleteWithCollection(collection *mongo.Collection, itemID primitive.ObjectID) error {
	res, err := collection.UpdateOne(
		context.Background(),
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
	var userObject User
	err := GetUserCollection(db).FindOne(
		context.Background(),
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
	var user User

	if err := GetUserCollection(db).FindOne(
		context.Background(),
		bson.M{"email": name + "@generaltask.com"}).Decode(&user); err != nil {
		return nil, err
	}
	return &user, nil
}

func CreateStateToken(db *mongo.Database, userID *primitive.ObjectID, useDeeplink bool) (*string, error) {
	stateToken := &StateToken{UseDeeplink: useDeeplink}
	if userID != nil {
		stateToken.UserID = *userID
	}
	cursor, err := GetStateTokenCollection(db).InsertOne(context.Background(), stateToken)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("failed to create new state token")
		return nil, err
	}
	stateTokenStr := cursor.InsertedID.(primitive.ObjectID).Hex()
	return &stateTokenStr, nil
}

func GetStateToken(db *mongo.Database, stateTokenID primitive.ObjectID, userID *primitive.ObjectID) (*StateToken, error) {
	var query bson.M
	if userID == nil {
		query = bson.M{"_id": stateTokenID}
	} else {
		query = bson.M{"$and": []bson.M{{"user_id": *userID}, {"_id": stateTokenID}}}
	}
	var token StateToken
	err := GetStateTokenCollection(db).FindOne(context.Background(), query).Decode(&token)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("failed to get state token")
		return nil, err
	}
	return &token, nil
}

func DeleteStateToken(db *mongo.Database, stateTokenID primitive.ObjectID, userID *primitive.ObjectID) error {
	var deletionQuery bson.M
	if userID == nil {
		deletionQuery = bson.M{"_id": stateTokenID}
	} else {
		deletionQuery = bson.M{"$and": []bson.M{{"user_id": *userID}, {"_id": stateTokenID}}}
	}
	result, err := GetStateTokenCollection(db).DeleteOne(context.Background(), deletionQuery)
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
	_, err := GetLogEventsCollection(db).InsertOne(context.Background(), &LogEvent{
		UserID:    userID,
		EventType: eventType,
		CreatedAt: primitive.NewDateTimeFromTime(time.Now()),
	})
	return err
}

func GetExternalToken(db *mongo.Database, externalID string, serviceID string) (*ExternalAPIToken, error) {
	var externalAPIToken ExternalAPIToken
	err := GetExternalTokenCollection(db).FindOne(
		context.Background(),
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

func GetExternalTokens(db *mongo.Database, userID primitive.ObjectID, serviceID string) (*[]ExternalAPIToken, error) {
	var tokens []ExternalAPIToken
	err := FindWithCollection(
		GetExternalTokenCollection(db),
		userID,
		&[]bson.M{{"service_id": serviceID}},
		&tokens,
		nil,
	)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("failed to load task sections")
		return nil, err
	}
	return &tokens, nil
}

func GetDefaultSectionName(db *mongo.Database, userID primitive.ObjectID) string {
	defaultSectionCollection := GetDefaultSectionSettingsCollection(db)

	var settings DefaultSectionSettings
	mongoResult := defaultSectionCollection.FindOne(
		context.Background(),
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

func GetView(db *mongo.Database, userID primitive.ObjectID, viewID primitive.ObjectID) (*View, error) {
	logger := logging.GetSentryLogger()
	viewCollection := GetViewCollection(db)
	mongoResult := FindOneWithCollection(viewCollection, userID, viewID)

	var view View
	err := mongoResult.Decode(&view)
	if err != nil {
		logger.Error().Err(err).Msgf("failed to get view: %+v", viewID)
		return nil, err
	}
	return &view, nil
}

type ReorderableSubmodel struct {
	ID         primitive.ObjectID `bson:"_id,omitempty"`
	IDOrdering int                `bson:"id_ordering"`
}

func AdjustOrderingIDsForCollection(collection *mongo.Collection, userID primitive.ObjectID, itemID primitive.ObjectID, orderingID int) error {
	_, err := collection.UpdateMany(
		context.Background(),
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

	options := options.Find().SetSort(bson.M{"id_ordering": 1})
	cursor, err := collection.Find(context.Background(), bson.M{"user_id": userID}, options)
	if err != nil {
		logger.Error().Err(err).Msg("failed to get items")
		return err
	}
	err = cursor.All(context.Background(), &items)
	if err != nil {
		logger.Error().Err(err).Msg("failed to get items")
		return err
	}

	for index, item := range items {
		newIDOrdering := index + 1
		if item.IDOrdering != newIDOrdering {
			collection.UpdateOne(
				context.Background(),
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
