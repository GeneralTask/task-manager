package external

import (
	"context"
	"encoding/json"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func TestLoadJIRATasks(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	externalAPITokenCollection := database.GetExternalTokenCollection(db)
	AtlassianSiteCollection := database.GetJiraSitesCollection(db)
	taskCollection := database.GetTaskCollection(db)

	t.Run("MissingJIRAToken", func(t *testing.T) {
		var JIRATasks = make(chan TaskResult)
		userID := primitive.NewObjectID()
		JIRA := JIRASource{Atlassian: AtlassianService{}}
		go JIRA.GetTasks(db, userID, "exampleAccountID", JIRATasks)
		result := <-JIRATasks
		assert.Equal(t, 0, len(result.Tasks))
	})
	t.Run("RefreshTokenFailed", func(t *testing.T) {
		userID, accountID := createJIRAToken(t, externalAPITokenCollection)
		tokenServer := getTokenServerForJIRA(t, http.StatusUnauthorized)
		var JIRATasks = make(chan TaskResult)
		JIRA := JIRASource{Atlassian: AtlassianService{Config: AtlassianConfig{ConfigValues: AtlassianConfigValues{TokenURL: &tokenServer.URL}}}}
		go JIRA.GetTasks(db, *userID, accountID, JIRATasks)
		result := <-JIRATasks
		assert.Equal(t, 0, len(result.Tasks))
	})

	t.Run("SearchFailed", func(t *testing.T) {
		userID, accountID := setupJIRA(t, externalAPITokenCollection, AtlassianSiteCollection)
		tokenServer := getTokenServerForJIRA(t, http.StatusOK)
		searchServer := getSearchServerForJIRA(t, http.StatusUnauthorized, false)
		var JIRATasks = make(chan TaskResult)
		JIRA := JIRASource{Atlassian: AtlassianService{Config: AtlassianConfig{ConfigValues: AtlassianConfigValues{APIBaseURL: &searchServer.URL, TokenURL: &tokenServer.URL}}}}
		go JIRA.GetTasks(db, *userID, accountID, JIRATasks)
		result := <-JIRATasks
		assert.Equal(t, 0, len(result.Tasks))
	})
	t.Run("EmptySearchResponse", func(t *testing.T) {
		userID, accountID := setupJIRA(t, externalAPITokenCollection, AtlassianSiteCollection)
		tokenServer := getTokenServerForJIRA(t, http.StatusOK)
		searchServer := getSearchServerForJIRA(t, http.StatusOK, true)
		var JIRATasks = make(chan TaskResult)
		JIRA := JIRASource{Atlassian: AtlassianService{Config: AtlassianConfig{ConfigValues: AtlassianConfigValues{APIBaseURL: &searchServer.URL, TokenURL: &tokenServer.URL}}}}
		go JIRA.GetTasks(db, *userID, accountID, JIRATasks)
		result := <-JIRATasks
		assert.Equal(t, 0, len(result.Tasks))
	})
	t.Run("Success", func(t *testing.T) {
		userID, accountID := setupJIRA(t, externalAPITokenCollection, AtlassianSiteCollection)
		tokenServer := getTokenServerForJIRA(t, http.StatusOK)
		searchServer := getSearchServerForJIRA(t, http.StatusOK, false)

		dueDate, _ := time.Parse("2006-01-02", "2021-04-20")
		primDueDate := primitive.NewDateTimeFromTime(dueDate)
		createdAt, _ := time.Parse("2006-01-02T15:04:05.999-0700", "2022-04-20T07:05:06.416-0800")
		primCreatedAt := primitive.NewDateTimeFromTime(createdAt)
		title := "Sample Taskeroni"
		body := ""
		expectedTask := database.Task{
			IDOrdering:        0,
			IDExternal:        "42069",
			IDTaskSection:     constants.IDTaskSectionDefault,
			Deeplink:          "https://dankmemes.com/browse/MOON-1969",
			Title:             &title,
			Body:              &body,
			SourceID:          TASK_SOURCE_ID_JIRA,
			UserID:            *userID,
			DueDate:           &primDueDate,
			CreatedAtExternal: primCreatedAt,
			Status: &database.ExternalTaskStatus{
				ExternalID:        "",
				State:             "todo",
				Type:              "",
				IsCompletedStatus: false,
				Position:          0,
				Color:             "",
				IconURL:           "",
			},
		}

		var JIRATasks = make(chan TaskResult)
		JIRA := JIRASource{Atlassian: AtlassianService{Config: AtlassianConfig{ConfigValues: AtlassianConfigValues{APIBaseURL: &searchServer.URL, TokenURL: &tokenServer.URL}}}}
		go JIRA.GetTasks(db, *userID, accountID, JIRATasks)
		result := <-JIRATasks
		assert.Equal(t, 1, len(result.Tasks))

		assertTasksEqual(t, &expectedTask, result.Tasks[0])

		var taskFromDB database.Task
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err := taskCollection.FindOne(
			dbCtx,
			bson.M{"$and": []bson.M{
				{"source_id": TASK_SOURCE_ID_JIRA},
				{"id_external": "42069"},
				{"user_id": userID},
			}},
		).Decode(&taskFromDB)
		assert.NoError(t, err)
		assertTasksEqual(t, &expectedTask, &taskFromDB)
		assert.Equal(t, accountID, taskFromDB.SourceAccountID)
	})
	t.Run("ExistingTask", func(t *testing.T) {
		userID, accountID := setupJIRA(t, externalAPITokenCollection, AtlassianSiteCollection)
		tokenServer := getTokenServerForJIRA(t, http.StatusOK)
		searchServer := getSearchServerForJIRA(t, http.StatusOK, false)

		dueDate, _ := time.Parse("2006-01-02", "2021-04-20")
		title := "Sample Taskeroni"
		body := ""
		dueDatePrim := primitive.NewDateTimeFromTime(dueDate)
		createdAt, _ := time.Parse("2006-01-02T15:04:05.999-0700", "2022-04-20T07:05:06.416-0800")
		primCreatedAt := primitive.NewDateTimeFromTime(createdAt)
		expectedTask := database.Task{
			IDExternal:        "42069",
			IDTaskSection:     constants.IDTaskSectionDefault,
			Deeplink:          "https://dankmemes.com/browse/MOON-1969",
			Title:             &title,
			Body:              &body,
			SourceID:          TASK_SOURCE_ID_JIRA,
			UserID:            *userID,
			SourceAccountID:   "someAccountID",
			DueDate:           &dueDatePrim,
			CreatedAtExternal: primCreatedAt,
			Status: &database.ExternalTaskStatus{
				ExternalID:        "",
				State:             "todo",
				Type:              "",
				IsCompletedStatus: false,
				Position:          0,
				Color:             "",
				IconURL:           "",
			},
		}
		database.GetOrCreateTask(
			db,
			*userID,
			"42069",
			TASK_SOURCE_ID_JIRA,
			&expectedTask,
		)

		var JIRATasks = make(chan TaskResult)
		JIRA := JIRASource{Atlassian: AtlassianService{Config: AtlassianConfig{ConfigValues: AtlassianConfigValues{APIBaseURL: &searchServer.URL, TokenURL: &tokenServer.URL}}}}
		go JIRA.GetTasks(db, *userID, accountID, JIRATasks)
		result := <-JIRATasks
		assert.Equal(t, 1, len(result.Tasks))

		assertTasksEqual(t, &expectedTask, result.Tasks[0])

		var taskFromDB database.Task
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err := taskCollection.FindOne(
			dbCtx,
			bson.M{"$and": []bson.M{
				{"source_id": TASK_SOURCE_ID_JIRA},
				{"id_external": "42069"},
				{"user_id": userID},
			}},
		).Decode(&taskFromDB)
		assert.NoError(t, err)
		assertTasksEqual(t, &expectedTask, &taskFromDB)
		assert.Equal(t, "someAccountID", taskFromDB.SourceAccountID) // doesn't get updated
	})
	t.Run("NewPriority", func(t *testing.T) {
		userID, accountID := setupJIRA(t, externalAPITokenCollection, AtlassianSiteCollection)
		tokenServer := getTokenServerForJIRA(t, http.StatusOK)
		searchServer := getSearchServerForJIRA(t, http.StatusOK, false)

		dueDate, _ := time.Parse("2006-01-02", "2021-04-20")
		title := "Sample Taskeroni"
		body := ""
		dueDatePrim := primitive.NewDateTimeFromTime(dueDate)
		createdAt, _ := time.Parse("2006-01-02T15:04:05.999-0700", "2022-04-20T07:05:06.416-0800")
		primCreatedAt := primitive.NewDateTimeFromTime(createdAt)
		priorityID := "something_that_will_change"
		expectedTask := database.Task{
			IDOrdering:        2,
			IDExternal:        "42069",
			IDTaskSection:     constants.IDTaskSectionDefault,
			Deeplink:          "https://dankmemes.com/browse/MOON-1969",
			Title:             &title,
			Body:              &body,
			SourceID:          TASK_SOURCE_ID_JIRA,
			UserID:            *userID,
			DueDate:           &dueDatePrim,
			PriorityID:        &priorityID,
			CreatedAtExternal: primCreatedAt,
			Status: &database.ExternalTaskStatus{
				ExternalID:        "",
				State:             "todo",
				Type:              "",
				IsCompletedStatus: false,
				Position:          0,
				Color:             "",
				IconURL:           "",
			},
		}
		database.GetOrCreateTask(
			db,
			*userID,
			"42069",
			TASK_SOURCE_ID_JIRA,
			&expectedTask,
		)

		var JIRATasks = make(chan TaskResult)
		JIRA := JIRASource{Atlassian: AtlassianService{Config: AtlassianConfig{ConfigValues: AtlassianConfigValues{APIBaseURL: &searchServer.URL, TokenURL: &tokenServer.URL}}}}
		go JIRA.GetTasks(db, *userID, accountID, JIRATasks)
		result := <-JIRATasks
		assert.Equal(t, 1, len(result.Tasks))

		// ordering ID should be reset to 0 if priority changes
		expectedTask.IDOrdering = 0
		assertTasksEqual(t, &expectedTask, result.Tasks[0])

		var taskFromDB database.Task
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err := taskCollection.FindOne(
			dbCtx,
			bson.M{"$and": []bson.M{
				{"source_id": TASK_SOURCE_ID_JIRA},
				{"id_external": "42069"},
				{"user_id": userID},
			}},
		).Decode(&taskFromDB)
		assert.NoError(t, err)
		// ordering ID in DB isn't updated until task merge
		expectedTask.IDOrdering = 2
		expectedTask.IDTaskSection = constants.IDTaskSectionDefault
		assertTasksEqual(t, &expectedTask, &taskFromDB)
	})
	t.Run("NewPriorityReordered", func(t *testing.T) {
		userID, accountID := setupJIRA(t, externalAPITokenCollection, AtlassianSiteCollection)
		tokenServer := getTokenServerForJIRA(t, http.StatusOK)
		searchServer := getSearchServerForJIRA(t, http.StatusOK, false)

		dueDate, _ := time.Parse("2006-01-02", "2021-04-20")
		title := "Sample Taskeroni"
		body := ""
		dueDatePrim := primitive.NewDateTimeFromTime(dueDate)
		createdAt, _ := time.Parse("2006-01-02T15:04:05.999-0700", "2022-04-20T07:05:06.416-0800")
		primCreatedAt := primitive.NewDateTimeFromTime(createdAt)
		priorityID := "something_that_will_change"
		expectedTask := database.Task{
			IDOrdering:        2,
			IDExternal:        "42069",
			IDTaskSection:     constants.IDTaskSectionDefault,
			HasBeenReordered:  true,
			Deeplink:          "https://dankmemes.com/browse/MOON-1969",
			Title:             &title,
			Body:              &body,
			SourceID:          TASK_SOURCE_ID_JIRA,
			UserID:            *userID,
			DueDate:           &dueDatePrim,
			PriorityID:        &priorityID,
			CreatedAtExternal: primCreatedAt,
			Status: &database.ExternalTaskStatus{
				ExternalID:        "",
				State:             "todo",
				Type:              "",
				IsCompletedStatus: false,
				Position:          0,
				Color:             "",
				IconURL:           "",
			},
		}
		database.GetOrCreateTask(
			db,
			*userID,
			"42069",
			TASK_SOURCE_ID_JIRA,
			&expectedTask,
		)

		var JIRATasks = make(chan TaskResult)
		JIRA := JIRASource{Atlassian: AtlassianService{Config: AtlassianConfig{ConfigValues: AtlassianConfigValues{APIBaseURL: &searchServer.URL, TokenURL: &tokenServer.URL}}}}
		go JIRA.GetTasks(db, *userID, accountID, JIRATasks)
		result := <-JIRATasks
		assert.Equal(t, 1, len(result.Tasks))

		assertTasksEqual(t, &expectedTask, result.Tasks[0])

		var taskFromDB database.Task
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err := taskCollection.FindOne(
			dbCtx,
			bson.M{"$and": []bson.M{
				{"source_id": TASK_SOURCE_ID_JIRA},
				{"id_external": "42069"},
				{"user_id": userID},
			}},
		).Decode(&taskFromDB)
		assert.NoError(t, err)
		assertTasksEqual(t, &expectedTask, &taskFromDB)
	})
}

func TestGetPriorities(t *testing.T) {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	prioritiesCollection := database.GetJiraPrioritiesCollection(db)

	userID, _ := setupJIRA(t, database.GetExternalTokenCollection(db), database.GetJiraSitesCollection(db))

	t.Run("ServerError", func(t *testing.T) {
		server := getJIRAPriorityServer(t, 400, []byte(``))
		defer server.Close()
		JIRA := JIRASource{Atlassian: AtlassianService{Config: AtlassianConfig{ConfigValues: AtlassianConfigValues{PriorityListURL: &server.URL}}}}
		err := JIRA.GetListOfPriorities(*userID, "sample")
		assert.Error(t, err)
	})

	t.Run("Success", func(t *testing.T) {
		server := getJIRAPriorityServer(t, 200, []byte(`[{"id": "9"},{"id": "5"}]`))
		defer server.Close()
		JIRA := JIRASource{Atlassian: AtlassianService{Config: AtlassianConfig{ConfigValues: AtlassianConfigValues{PriorityListURL: &server.URL}}}}
		err := JIRA.GetListOfPriorities(*userID, "sample")
		assert.NoError(t, err)

		options := options.Find()
		options.SetSort(bson.M{"integer_priority": 1})
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		cursor, err := prioritiesCollection.Find(dbCtx, bson.M{"user_id": userID}, options)
		assert.NoError(t, err)
		var priorities []database.JIRAPriority
		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = cursor.All(dbCtx, &priorities)
		assert.NoError(t, err)
		assert.Equal(t, 2, len(priorities))
		assert.Equal(t, "9", priorities[0].JIRAID)
		assert.Equal(t, 1, priorities[0].IntegerPriority)
		assert.Equal(t, "5", priorities[1].JIRAID)
		assert.Equal(t, 2, priorities[1].IntegerPriority)

		server = getJIRAPriorityServer(t, http.StatusOK, []byte(`[{"id": "8"}]`))
		JIRA = JIRASource{Atlassian: AtlassianService{Config: AtlassianConfig{ConfigValues: AtlassianConfigValues{PriorityListURL: &server.URL}}}}
		err = JIRA.GetListOfPriorities(*userID, "sample")
		assert.NoError(t, err)

		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		cursor, err = prioritiesCollection.Find(dbCtx, bson.M{"user_id": userID}, options)
		assert.NoError(t, err)
		err = cursor.All(parentCtx, &priorities)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(priorities))
		assert.Equal(t, "8", priorities[0].JIRAID)
		assert.Equal(t, 1, priorities[0].IntegerPriority)
	})
}

func setupJIRA(t *testing.T, externalAPITokenCollection *mongo.Collection, AtlassianSiteCollection *mongo.Collection) (*primitive.ObjectID, string) {
	userID, accountID := createJIRAToken(t, externalAPITokenCollection)
	createAtlassianSiteConfiguration(t, userID, AtlassianSiteCollection)
	return userID, accountID
}

func createJIRAToken(t *testing.T, externalAPITokenCollection *mongo.Collection) (*primitive.ObjectID, string) {
	parentCtx := context.Background()
	userID := primitive.NewObjectID()
	accountID := primitive.NewObjectID().Hex()
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	_, err := externalAPITokenCollection.InsertOne(
		dbCtx,
		&database.ExternalAPIToken{
			ServiceID: TASK_SERVICE_ID_ATLASSIAN,
			Token:     `{"access_token":"sample-token","refresh_token":"sample-token","scope":"sample-scope","expires_in":3600,"token_type":"Bearer"}`,
			UserID:    userID,
			AccountID: accountID,
		},
	)
	assert.NoError(t, err)
	return &userID, accountID
}

func createAtlassianSiteConfiguration(t *testing.T, userID *primitive.ObjectID, AtlassianSiteCollection *mongo.Collection) {
	parentCtx := context.Background()
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	_, err := AtlassianSiteCollection.UpdateOne(
		dbCtx,
		bson.M{"user_id": userID},
		bson.M{"$set": &database.AtlassianSiteConfiguration{
			UserID:  *userID,
			CloudID: "sample_cloud_id",
			SiteURL: "https://dankmemes.com",
		}},
		options.Update().SetUpsert(true),
	)
	assert.NoError(t, err)
}

func getSearchServerForJIRA(t *testing.T, statusCode int, empty bool) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "Bearer sample-access-token", r.Header.Get("Authorization"))
		body, err := ioutil.ReadAll(r.Body)
		assert.NoError(t, err)
		assert.Equal(t, "", string(body))
		w.WriteHeader(statusCode)
		if empty {
			result, err := json.Marshal(JIRATaskList{Issues: []JIRATask{}})
			assert.NoError(t, err)
			w.Write(result)
		} else {
			result, err := json.Marshal(JIRATaskList{Issues: []JIRATask{{
				Fields: JIRATaskFields{DueDate: "2021-04-20", Summary: "Sample Taskeroni", CreatedAt: "2022-04-20T07:05:06.416-0800", Status: JIRAStatus{Name: "todo"}},
				ID:     "42069",
				Key:    "MOON-1969",
			}}})
			assert.NoError(t, err)
			w.Write(result)
		}
	}))
}

func getTokenServerForJIRA(t *testing.T, statusCode int) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, err := ioutil.ReadAll(r.Body)
		assert.NoError(t, err)
		w.WriteHeader(statusCode)
		w.Write([]byte(`{"access_token":"sample-access-token","refresh_token":"sample-refresh-token","scope":"sample-scope","expires_in":3600,"token_type":"Bearer"}`))
	}))
}

func getJIRAPriorityServer(t *testing.T, statusCode int, response []byte) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/rest/api/3/priority/", r.RequestURI)
		assert.Equal(t, "GET", r.Method)
		w.WriteHeader(statusCode)
		w.Write(response)
	}))
}
