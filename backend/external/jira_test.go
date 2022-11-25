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
	"github.com/GeneralTask/task-manager/backend/testutils"
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
		statusServer := getStatusServerForJIRA(t, http.StatusOK, false)

		// ensure external API token values updated
		var externalJIRAToken database.ExternalAPIToken
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = database.GetExternalTokenCollection(db).FindOne(
			dbCtx,
			bson.M{"$and": []bson.M{
				{"service_id": TASK_SERVICE_ID_ATLASSIAN},
				{"user_id": userID},
			}},
		).Decode(&externalJIRAToken)
		assert.NoError(t, err)

		var newToken AtlassianAuthToken
		err = json.Unmarshal([]byte(externalJIRAToken.Token), &newToken)
		assert.NoError(t, err)

		assert.NotEqual(t, "sample-access-token", newToken.AccessToken)
		assert.NotEqual(t, "sample-refresh-token", newToken.RefreshToken)

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
				IconURL:           "https://example.com",
			},
		}

		var JIRATasks = make(chan TaskResult)
		JIRA := JIRASource{Atlassian: AtlassianService{Config: AtlassianConfig{ConfigValues: AtlassianConfigValues{APIBaseURL: &searchServer.URL, TokenURL: &tokenServer.URL, StatusListURL: &statusServer.URL}}}}
		go JIRA.GetTasks(db, *userID, accountID, JIRATasks)
		result := <-JIRATasks
		assert.Equal(t, 1, len(result.Tasks))

		assertTasksEqual(t, &expectedTask, result.Tasks[0])

		var taskFromDB database.Task
		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
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

		// ensure external API token values updated
		dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		err = database.GetExternalTokenCollection(db).FindOne(
			dbCtx,
			bson.M{"$and": []bson.M{
				{"service_id": TASK_SERVICE_ID_ATLASSIAN},
				{"user_id": userID},
			}},
		).Decode(&externalJIRAToken)
		assert.NoError(t, err)

		err = json.Unmarshal([]byte(externalJIRAToken.Token), &newToken)
		assert.NoError(t, err)

		assert.Equal(t, "sample-access-token", newToken.AccessToken)
		assert.Equal(t, "sample-refresh-token", newToken.RefreshToken)
	})
	t.Run("ExistingTask", func(t *testing.T) {
		userID, accountID := setupJIRA(t, externalAPITokenCollection, AtlassianSiteCollection)
		tokenServer := getTokenServerForJIRA(t, http.StatusOK)
		searchServer := getSearchServerForJIRA(t, http.StatusOK, false)
		statusServer := getStatusServerForJIRA(t, http.StatusOK, false)

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
				IconURL:           "https://example.com",
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
		JIRA := JIRASource{Atlassian: AtlassianService{Config: AtlassianConfig{ConfigValues: AtlassianConfigValues{APIBaseURL: &searchServer.URL, TokenURL: &tokenServer.URL, StatusListURL: &statusServer.URL}}}}
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
		statusServer := getStatusServerForJIRA(t, http.StatusOK, false)

		server := getJIRAPriorityServer(t, 200, []byte(`[{"id": "9","iconUrl":"https://example.com"},{"id": "5","iconUrl":"https://example2.com"}]`))
		defer server.Close()

		dueDate, _ := time.Parse("2006-01-02", "2021-04-20")
		title := "Sample Taskeroni"
		body := ""
		dueDatePrim := primitive.NewDateTimeFromTime(dueDate)
		createdAt, _ := time.Parse("2006-01-02T15:04:05.999-0700", "2022-04-20T07:05:06.416-0800")
		primCreatedAt := primitive.NewDateTimeFromTime(createdAt)
		priorityNormalized := 1.0
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
			CreatedAtExternal: primCreatedAt,
			Status: &database.ExternalTaskStatus{
				ExternalID:        "",
				State:             "todo",
				Type:              "",
				IsCompletedStatus: false,
				Position:          0,
				Color:             "",
				IconURL:           "https://example.com",
			},
			PriorityNormalized: &priorityNormalized,
			ExternalPriority: &database.ExternalTaskPriority{
				ExternalID: "9",
				Name:       "todo",
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
		JIRA := JIRASource{Atlassian: AtlassianService{Config: AtlassianConfig{ConfigValues: AtlassianConfigValues{APIBaseURL: &searchServer.URL, TokenURL: &tokenServer.URL, StatusListURL: &statusServer.URL, PriorityListURL: &server.URL}}}}
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
		// ordering ID in DB isn't updated until task merge
		expectedTask.IDOrdering = 2
		expectedTask.IDTaskSection = constants.IDTaskSectionDefault
		assertTasksEqual(t, &expectedTask, &taskFromDB)
	})
	t.Run("NewPriorityReordered", func(t *testing.T) {
		userID, accountID := setupJIRA(t, externalAPITokenCollection, AtlassianSiteCollection)
		tokenServer := getTokenServerForJIRA(t, http.StatusOK)
		searchServer := getSearchServerForJIRA(t, http.StatusOK, false)
		statusServer := getStatusServerForJIRA(t, http.StatusOK, false)

		dueDate, _ := time.Parse("2006-01-02", "2021-04-20")
		title := "Sample Taskeroni"
		body := ""
		dueDatePrim := primitive.NewDateTimeFromTime(dueDate)
		createdAt, _ := time.Parse("2006-01-02T15:04:05.999-0700", "2022-04-20T07:05:06.416-0800")
		primCreatedAt := primitive.NewDateTimeFromTime(createdAt)
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
			CreatedAtExternal: primCreatedAt,
			Status: &database.ExternalTaskStatus{
				ExternalID:        "",
				State:             "todo",
				Type:              "",
				IsCompletedStatus: false,
				Position:          0,
				Color:             "",
				IconURL:           "https://example.com",
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
		JIRA := JIRASource{Atlassian: AtlassianService{Config: AtlassianConfig{ConfigValues: AtlassianConfigValues{APIBaseURL: &searchServer.URL, TokenURL: &tokenServer.URL, StatusListURL: &statusServer.URL}}}}
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

func TestGetStatuses(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	userID, _ := setupJIRA(t, database.GetExternalTokenCollection(db), database.GetJiraSitesCollection(db))

	t.Run("NoResponse", func(t *testing.T) {
		JIRA := JIRASource{Atlassian: AtlassianService{}}
		_, err := JIRA.GetListOfStatuses(*userID, "sample")
		assert.Error(t, err)
	})
	t.Run("ServerError", func(t *testing.T) {
		server := getStatusServerForJIRA(t, 400, true)
		defer server.Close()
		JIRA := JIRASource{Atlassian: AtlassianService{Config: AtlassianConfig{ConfigValues: AtlassianConfigValues{StatusListURL: &server.URL}}}}
		_, err := JIRA.GetListOfStatuses(*userID, "sample")
		assert.Error(t, err)
	})
	t.Run("Success", func(t *testing.T) {
		server := getStatusServerForJIRA(t, 200, false)
		defer server.Close()
		JIRA := JIRASource{Atlassian: AtlassianService{Config: AtlassianConfig{ConfigValues: AtlassianConfigValues{StatusListURL: &server.URL}}}}
		statusMap, err := JIRA.GetListOfStatuses(*userID, "sample")
		assert.NoError(t, err)

		statusList, exists := statusMap["10000"]
		assert.True(t, exists)
		assert.Equal(t, 2, len(statusList))
		assert.Equal(t, "Todo", statusList[0].State)
		assert.Equal(t, "https://example.com", statusList[0].IconURL)
		assert.True(t, statusList[1].IsCompletedStatus)
	})
}

func TestGetPriorities(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	userID, _ := setupJIRA(t, database.GetExternalTokenCollection(db), database.GetJiraSitesCollection(db))

	t.Run("ServerError", func(t *testing.T) {
		server := getJIRAPriorityServer(t, 400, []byte(``))
		defer server.Close()
		JIRA := JIRASource{Atlassian: AtlassianService{Config: AtlassianConfig{ConfigValues: AtlassianConfigValues{PriorityListURL: &server.URL}}}}
		_, err := JIRA.GetListOfPriorities(*userID, "sample")
		assert.Error(t, err)
	})

	t.Run("Success", func(t *testing.T) {
		server := getJIRAPriorityServer(t, 200, []byte(`[{"id": "9","iconUrl":"https://example.com"},{"id": "5","iconUrl":"https://example2.com"}]`))
		defer server.Close()
		JIRA := JIRASource{Atlassian: AtlassianService{Config: AtlassianConfig{ConfigValues: AtlassianConfigValues{PriorityListURL: &server.URL}}}}
		priorities, err := JIRA.GetListOfPriorities(*userID, "sample")
		assert.NoError(t, err)

		assert.Equal(t, 2, len(priorities))
		assert.Equal(t, "9", priorities[0].ID)
		assert.Equal(t, "https://example.com", priorities[0].IconURL)
		assert.Equal(t, "5", priorities[1].ID)
		assert.Equal(t, "https://example2.com", priorities[1].IconURL)
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
				Fields: JIRATaskFields{DueDate: "2021-04-20", Summary: "Sample Taskeroni", CreatedAt: "2022-04-20T07:05:06.416-0800", Status: JIRAStatus{Name: "todo", IconURL: "https://example.com"}, Project: JIRAProject{ID: "10000"}, Priority: JIRAPriority{ID: "9", Name: "todo", IconURL: "https://example.com"}},
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

func getStatusServerForJIRA(t *testing.T, statusCode int, empty bool) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/rest/api/3/status/", r.RequestURI)
		assert.Equal(t, "GET", r.Method)
		w.WriteHeader(statusCode)
		var result []byte
		if empty {
			result = []byte(``)
		} else {
			resultTemp, err := json.Marshal([]JIRAStatus{
				{
					ID:      "10000",
					Name:    "Todo",
					IconURL: "https://example.com",
					Category: JIRAStatusCategory{
						Key: "new",
					},
					Scope: JIRAScope{
						Project: JIRAProject{
							ID: "10000",
						},
					},
				},
				{
					ID:      "10003",
					Name:    "Done",
					IconURL: "https://example.com",
					Category: JIRAStatusCategory{
						Key: "done",
					},
					Scope: JIRAScope{
						Project: JIRAProject{
							ID: "10000",
						},
					},
				},
			})
			assert.NoError(t, err)
			result = resultTemp
		}
		w.Write(result)
	}))
}

func getTransitionServerForJIRA(t *testing.T, statusCode int, empty bool) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(statusCode)
		var result []byte
		if empty {
			result = []byte(``)
		} else {
			resultTemp, err := json.Marshal(JIRATransitionList{
				Transitions: []JIRATransition{
					{
						ID: "100",
						ToStatus: JIRAStatus{
							ID:      "10000",
							Name:    "Todo",
							IconURL: "https://example.com",
							Category: JIRAStatusCategory{
								Key: "new",
							},
							Scope: JIRAScope{
								Project: JIRAProject{
									ID: "10000",
								},
							},
						},
					},
					{
						ID: "101",
						ToStatus: JIRAStatus{
							ID:      "10003",
							Name:    "Done",
							IconURL: "https://example.com",
							Category: JIRAStatusCategory{
								Key: "done",
							},
							Scope: JIRAScope{
								Project: JIRAProject{
									ID: "10000",
								},
							},
						},
					},
				},
			})
			assert.NoError(t, err)
			result = resultTemp
		}
		w.Write(result)
	}))
}
func TestModifyJIRATask(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	externalAPITokenCollection := database.GetExternalTokenCollection(db)
	AtlassianSiteCollection := database.GetJiraSitesCollection(db)

	userID, account_id := setupJIRA(t, externalAPITokenCollection, AtlassianSiteCollection)
	createdAt, _ := time.Parse("2006-01-02", "2019-04-20")
	completed := false
	testTitle := "test title"
	testDescription := "test description"
	dueDate := primitive.NewDateTimeFromTime(time.Time{})
	expectedTask := database.Task{
		IDOrdering:        0,
		IDExternal:        "6942069420",
		IDTaskSection:     constants.IDTaskSectionDefault,
		IsCompleted:       &completed,
		Deeplink:          "https://example.com/",
		Title:             &testTitle,
		Body:              &testDescription,
		SourceID:          TASK_SOURCE_ID_JIRA,
		SourceAccountID:   account_id,
		UserID:            *userID,
		DueDate:           &dueDate,
		CreatedAtExternal: primitive.NewDateTimeFromTime(createdAt),
		Status: &database.ExternalTaskStatus{
			ExternalID: "10000",
			State:      "Todo",
			Type:       "new",
		},
		AllStatuses: []*database.ExternalTaskStatus{
			{
				ExternalID: "10000",
				State:      "Todo",
				Type:       "new",
			},
			{
				ExternalID:        "10003",
				State:             "Done",
				Type:              "done",
				IsCompletedStatus: true,
			},
		},
		Comments: nil,
	}
	database.GetOrCreateTask(
		db,
		*userID,
		"test-issue-id-1",
		TASK_SOURCE_ID_JIRA,
		&expectedTask,
	)

	t.Run("ChangeStatusBadResponse", func(t *testing.T) {
		tokenServer := getTokenServerForJIRA(t, http.StatusOK)
		transitionServer := testutils.GetMockAPIServer(t, 400, "")
		defer transitionServer.Close()
		JIRA := JIRASource{Atlassian: AtlassianService{Config: AtlassianConfig{ConfigValues: AtlassianConfigValues{TransitionURL: &transitionServer.URL, TokenURL: &tokenServer.URL}}}}

		err := JIRA.ModifyTask(db, *userID, account_id, "6942069420", &database.Task{Status: &database.ExternalTaskStatus{ExternalID: "10003"}}, &database.Task{})
		assert.NotEqual(t, nil, err)
		assert.Equal(t, `transition not found`, err.Error())
	})
	t.Run("UpdateStatusOnlySuccess", func(t *testing.T) {
		tokenServer := getTokenServerForJIRA(t, http.StatusOK)
		transitionServer := getTransitionServerForJIRA(t, 200, false)
		defer transitionServer.Close()
		JIRA := JIRASource{Atlassian: AtlassianService{Config: AtlassianConfig{ConfigValues: AtlassianConfigValues{TransitionURL: &transitionServer.URL, TokenURL: &tokenServer.URL}}}}

		err := JIRA.ModifyTask(db, *userID, account_id, "6942069420", &database.Task{Status: &database.ExternalTaskStatus{ExternalID: "10003"}}, &database.Task{})
		assert.NoError(t, err)
	})
	t.Run("UpdateFieldsBadResponse", func(t *testing.T) {
		tokenServer := getTokenServerForJIRA(t, http.StatusOK)
		taskUpdateServer := testutils.GetMockAPIServer(t, 400, "")
		defer taskUpdateServer.Close()
		JIRA := JIRASource{Atlassian: AtlassianService{Config: AtlassianConfig{ConfigValues: AtlassianConfigValues{IssueUpdateURL: &taskUpdateServer.URL, TokenURL: &tokenServer.URL}}}}

		newTitle := "title!"

		err := JIRA.ModifyTask(db, *userID, account_id, "6942069420", &database.Task{Title: &newTitle}, &database.Task{})
		assert.NotEqual(t, nil, err)
		assert.Equal(t, `unable to successfully make field update request`, err.Error())
	})
	t.Run("UpdateFieldsSuccess", func(t *testing.T) {
		tokenServer := getTokenServerForJIRA(t, http.StatusOK)
		taskUpdateServer := testutils.GetMockAPIServer(t, 204, "")
		defer taskUpdateServer.Close()
		JIRA := JIRASource{Atlassian: AtlassianService{Config: AtlassianConfig{ConfigValues: AtlassianConfigValues{IssueUpdateURL: &taskUpdateServer.URL, TokenURL: &tokenServer.URL}}}}

		newName := "New Title"
		newBody := "New Body"

		err := JIRA.ModifyTask(db, *userID, account_id, "6942069420", &database.Task{
			Title: &newName,
			Body:  &newBody,
			ExternalPriority: &database.ExternalTaskPriority{
				ExternalID: "1",
			},
		}, &database.Task{})
		assert.NoError(t, err)
	})
	t.Run("UpdateTitleStatusSuccess", func(t *testing.T) {
		tokenServer := getTokenServerForJIRA(t, http.StatusOK)
		taskUpdateServer := testutils.GetMockAPIServer(t, 204, "")
		transitionServer := getTransitionServerForJIRA(t, 200, false)
		defer taskUpdateServer.Close()
		JIRA := JIRASource{Atlassian: AtlassianService{Config: AtlassianConfig{ConfigValues: AtlassianConfigValues{TransitionURL: &transitionServer.URL, IssueUpdateURL: &taskUpdateServer.URL, TokenURL: &tokenServer.URL}}}}

		newName := "New Title"

		err := JIRA.ModifyTask(db, *userID, account_id, "6942069420", &database.Task{
			Title:  &newName,
			Status: &database.ExternalTaskStatus{ExternalID: "10003"},
		}, &database.Task{})
		assert.NoError(t, err)
	})
	t.Run("UpdateEmptyDescriptionSuccess", func(t *testing.T) {
		tokenServer := getTokenServerForJIRA(t, http.StatusOK)
		taskUpdateServer := testutils.GetMockAPIServer(t, 204, "")
		defer taskUpdateServer.Close()
		JIRA := JIRASource{Atlassian: AtlassianService{Config: AtlassianConfig{ConfigValues: AtlassianConfigValues{IssueUpdateURL: &taskUpdateServer.URL, TokenURL: &tokenServer.URL}}}}

		newBody := ""

		err := JIRA.ModifyTask(db, *userID, account_id, "6942069420", &database.Task{
			Body: &newBody,
		}, &database.Task{})
		assert.NoError(t, err)
	})
	t.Run("UpdateEmptyTitleFails", func(t *testing.T) {
		tokenServer := getTokenServerForJIRA(t, http.StatusOK)
		taskUpdateServer := testutils.GetMockAPIServer(t, 204, "")
		defer taskUpdateServer.Close()
		JIRA := JIRASource{Atlassian: AtlassianService{Config: AtlassianConfig{ConfigValues: AtlassianConfigValues{IssueUpdateURL: &taskUpdateServer.URL, TokenURL: &tokenServer.URL}}}}

		newName := ""
		newBody := "New Body"

		err := JIRA.ModifyTask(db, *userID, account_id, "6942069420", &database.Task{
			Title: &newName,
			Body:  &newBody,
		}, &database.Task{})

		assert.EqualErrorf(t, err, err.Error(), "cannot set JIRA issue title to empty string")
	})
	t.Run("DeleteBadResponse", func(t *testing.T) {
		tokenServer := getTokenServerForJIRA(t, http.StatusOK)
		deleteServer := testutils.GetMockAPIServer(t, 400, "")
		defer deleteServer.Close()
		JIRA := JIRASource{Atlassian: AtlassianService{Config: AtlassianConfig{ConfigValues: AtlassianConfigValues{IssueDeleteURL: &deleteServer.URL, TokenURL: &tokenServer.URL}}}}

		deleted := true
		err := JIRA.ModifyTask(db, *userID, account_id, "6942069420", &database.Task{IsDeleted: &deleted}, &database.Task{})
		assert.NotEqual(t, nil, err)
		assert.Equal(t, `unable to successfully delete JIRA task`, err.Error())
	})
	t.Run("DeleteSuccess", func(t *testing.T) {
		tokenServer := getTokenServerForJIRA(t, http.StatusOK)
		deleteServer := testutils.GetMockAPIServer(t, 200, "")
		defer deleteServer.Close()
		JIRA := JIRASource{Atlassian: AtlassianService{Config: AtlassianConfig{ConfigValues: AtlassianConfigValues{IssueDeleteURL: &deleteServer.URL, TokenURL: &tokenServer.URL}}}}

		deleted := true
		err := JIRA.ModifyTask(db, *userID, account_id, "6942069420", &database.Task{IsDeleted: &deleted}, &database.Task{})
		assert.NoError(t, err)
	})
	t.Run("UndeleteFailure", func(t *testing.T) {
		database.GetOrCreateTask(
			db,
			*userID,
			"test-issue-id-1",
			TASK_SOURCE_ID_JIRA,
			&expectedTask,
		)

		_, err := database.UpdateOrCreateTask(db, *userID, "test-issue-id-1", TASK_SOURCE_ID_JIRA, nil, bson.M{"is_deleted": true}, nil)
		assert.NoError(t, err)

		tokenServer := getTokenServerForJIRA(t, http.StatusOK)
		deleteServer := testutils.GetMockAPIServer(t, 200, "")
		defer deleteServer.Close()
		JIRA := JIRASource{Atlassian: AtlassianService{Config: AtlassianConfig{ConfigValues: AtlassianConfigValues{IssueDeleteURL: &deleteServer.URL, TokenURL: &tokenServer.URL}}}}

		deleted := false
		err = JIRA.ModifyTask(db, *userID, account_id, "6942069420", &database.Task{IsDeleted: &deleted}, &database.Task{})
		assert.Error(t, err)
		assert.Equal(t, `cannot undelete JIRA tasks`, err.Error())
	})
}
