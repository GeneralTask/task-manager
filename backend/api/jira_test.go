package api

import (
	"context"
	"encoding/json"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/config"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func TestAuthorizeJIRA(t *testing.T) {
	t.Run("CookieMissing", func(t *testing.T) {
		TestAuthorizeCookieMissing(t, &API{}, "/authorize/jira/")
	})

	t.Run("CookieBad", func(t *testing.T) {
		TestAuthorizeCookieBad(t, &API{}, "/authorize/jira/")
	})

	t.Run("Success", func(t *testing.T) {
		TestAuthorizeSuccess(t, &API{}, "/authorize/jira/", func(stateToken string) string {
			return "<a href=\"https://auth.atlassian.com/authorize?audience=api.atlassian.com&amp;client_id=" + config.GetConfigValue("JIRA_OAUTH_CLIENT_ID") + "&amp;scope=offline_access%20read%3Ajira-user%20read%3Ajira-work%20write%3Ajira-work&amp;redirect_uri=" + config.GetConfigValue("SERVER_URL") + "authorize%2Fjira%2Fcallback%2F&amp;state=" + stateToken + "&amp;response_type=code&amp;prompt=consent\">Found</a>.\n\n"
		})
	})
}

func TestAuthorizeJIRACallback(t *testing.T) {
	t.Run("CookieMissing", func(t *testing.T) {
		TestAuthorizeCookieMissing(t, &API{}, "/authorize/jira/callback/")
	})
	t.Run("CookieBad", func(t *testing.T) {
		TestAuthorizeCookieBad(t, &API{}, "/authorize/jira/callback/")
	})
	t.Run("MissingCodeParam", func(t *testing.T) {
		TestAuthorizeCallbackMissingCodeParam(t, &API{}, "/authorize/jira/callback/")
	})
	t.Run("BadStateTokenFormat", func(t *testing.T) {
		TestAuthorizeCallbackBadStateTokenFormat(t, &API{}, "/authorize/jira/callback/")
	})
	t.Run("InvalidStateToken", func(t *testing.T) {
		TestAuthorizeCallbackInvalidStateToken(t, &API{}, "/authorize/jira/callback/")
	})
	t.Run("InvalidStateTokenWrongUser", func(t *testing.T) {
		TestAuthorizeCallbackStateTokenWrongUser(t, &API{}, "/authorize/jira/callback/")
	})
	t.Run("UnsuccessfulResponse", func(t *testing.T) {
		server := getTokenServerForJIRA(t, http.StatusUnauthorized)
		TestAuthorizeCallbackUnsuccessfulResponse(t, &API{JIRAConfigValues: JIRAConfig{TokenURL: &server.URL}}, "/authorize/jira/callback/")
	})
	t.Run("Success", func(t *testing.T) {

		tokenServer := getTokenServerForJIRA(t, http.StatusOK)
		cloudServer := getCloudIDServerForJIRA(t, http.StatusOK, false)
		priorityServer := getJIRAPriorityServer(t, http.StatusOK, []byte(`[{"id" : "1"}]`))

		api := &API{JIRAConfigValues: JIRAConfig{
			TokenURL:        &tokenServer.URL,
			CloudIDURL:      &cloudServer.URL,
			PriorityListURL: &priorityServer.URL,
		}}

		TestAuthorizeCallbackSuccessfulResponse(t, api, "/authorize/jira/callback/", database.TaskSourceJIRA.Name)
	})
}

func TestLoadJIRATasks(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	externalAPITokenCollection := db.Collection("external_api_tokens")
	AtlassianSiteCollection := db.Collection("jira_site_collection")
	taskCollection := db.Collection("tasks")

	t.Run("MissingJIRAToken", func(t *testing.T) {
		var JIRATasks = make(chan TaskResult)
		userID := primitive.NewObjectID()
		go LoadJIRATasks(&API{}, userID, "exampleAccountID", JIRATasks)
		result := <-JIRATasks
		assert.Equal(t, 0, len(result.Tasks))
	})
	t.Run("RefreshTokenFailed", func(t *testing.T) {
		userID, accountID := createJIRAToken(t, externalAPITokenCollection)
		tokenServer := getTokenServerForJIRA(t, http.StatusUnauthorized)
		var JIRATasks = make(chan TaskResult)
		go LoadJIRATasks(&API{JIRAConfigValues: JIRAConfig{TokenURL: &tokenServer.URL}}, *userID, accountID, JIRATasks)
		result := <-JIRATasks
		assert.Equal(t, 0, len(result.Tasks))
	})

	t.Run("SearchFailed", func(t *testing.T) {
		userID, accountID := setupJIRA(t, externalAPITokenCollection, AtlassianSiteCollection)
		tokenServer := getTokenServerForJIRA(t, http.StatusOK)
		searchServer := getSearchServerForJIRA(t, http.StatusUnauthorized, false)
		var JIRATasks = make(chan TaskResult)
		go LoadJIRATasks(&API{JIRAConfigValues: JIRAConfig{APIBaseURL: &searchServer.URL, TokenURL: &tokenServer.URL}}, *userID, accountID, JIRATasks)
		result := <-JIRATasks
		assert.Equal(t, 0, len(result.Tasks))
	})
	t.Run("EmptySearchResponse", func(t *testing.T) {
		userID, accountID := setupJIRA(t, externalAPITokenCollection, AtlassianSiteCollection)
		tokenServer := getTokenServerForJIRA(t, http.StatusOK)
		searchServer := getSearchServerForJIRA(t, http.StatusOK, true)
		var JIRATasks = make(chan TaskResult)
		go LoadJIRATasks(&API{JIRAConfigValues: JIRAConfig{APIBaseURL: &searchServer.URL, TokenURL: &tokenServer.URL}}, *userID, accountID, JIRATasks)
		result := <-JIRATasks
		assert.Equal(t, 0, len(result.Tasks))
	})
	t.Run("Success", func(t *testing.T) {
		userID, accountID := setupJIRA(t, externalAPITokenCollection, AtlassianSiteCollection)
		tokenServer := getTokenServerForJIRA(t, http.StatusOK)
		searchServer := getSearchServerForJIRA(t, http.StatusOK, false)

		dueDate, _ := time.Parse("2006-01-02", "2021-04-20")
		expectedTask := database.Task{
			TaskBase: database.TaskBase{
				IDOrdering:    0,
				IDExternal:    "42069",
				IDTaskSection: IDTaskSectionToday,
				Deeplink:      "https://dankmemes.com/browse/MOON-1969",
				Title:         "Sample Taskeroni",
				Source:        database.TaskSourceJIRA,
				UserID:        *userID,
			},
			DueDate: primitive.NewDateTimeFromTime(dueDate),
		}

		var JIRATasks = make(chan TaskResult)
		go LoadJIRATasks(&API{JIRAConfigValues: JIRAConfig{APIBaseURL: &searchServer.URL, TokenURL: &tokenServer.URL}}, *userID, accountID, JIRATasks)
		result := <-JIRATasks
		assert.Equal(t, 1, len(result.Tasks))

		assertTasksEqual(t, &expectedTask, result.Tasks[0])

		var taskFromDB database.Task
		err := taskCollection.FindOne(
			context.TODO(),
			bson.M{"$and": []bson.M{
				{"source.name": database.TaskSourceJIRA.Name},
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
		expectedTask := database.Task{
			TaskBase: database.TaskBase{
				IDOrdering:      2,
				IDExternal:      "42069",
				IDTaskSection:   IDTaskSectionToday,
				Deeplink:        "https://dankmemes.com/browse/MOON-1969",
				Title:           "Sample Taskeroni",
				Source:          database.TaskSourceJIRA,
				UserID:          *userID,
				SourceAccountID: "someAccountID",
			},
			DueDate: primitive.NewDateTimeFromTime(dueDate),
		}
		database.GetOrCreateTask(
			db,
			*userID,
			"42069",
			database.TaskSourceJIRA,
			&expectedTask,
		)

		var JIRATasks = make(chan TaskResult)
		go LoadJIRATasks(&API{JIRAConfigValues: JIRAConfig{APIBaseURL: &searchServer.URL, TokenURL: &tokenServer.URL}}, *userID, accountID, JIRATasks)
		result := <-JIRATasks
		assert.Equal(t, 1, len(result.Tasks))

		assertTasksEqual(t, &expectedTask, result.Tasks[0])

		var taskFromDB database.Task
		err := taskCollection.FindOne(
			context.TODO(),
			bson.M{"$and": []bson.M{
				{"source.name": database.TaskSourceJIRA.Name},
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
		expectedTask := database.Task{
			TaskBase: database.TaskBase{
				IDOrdering:    2,
				IDExternal:    "42069",
				IDTaskSection: IDTaskSectionBlocked,
				Deeplink:      "https://dankmemes.com/browse/MOON-1969",
				Title:         "Sample Taskeroni",
				Source:        database.TaskSourceJIRA,
				UserID:        *userID,
			},
			PriorityID: "something_that_will_change",
			DueDate:    primitive.NewDateTimeFromTime(dueDate),
		}
		database.GetOrCreateTask(
			db,
			*userID,
			"42069",
			database.TaskSourceJIRA,
			&expectedTask,
		)

		var JIRATasks = make(chan TaskResult)
		go LoadJIRATasks(&API{JIRAConfigValues: JIRAConfig{APIBaseURL: &searchServer.URL, TokenURL: &tokenServer.URL}}, *userID, accountID, JIRATasks)
		result := <-JIRATasks
		assert.Equal(t, 1, len(result.Tasks))

		// ordering ID should be reset to 0 if priority changes
		expectedTask.IDOrdering = 0
		assertTasksEqual(t, &expectedTask, result.Tasks[0])

		var taskFromDB database.Task
		err := taskCollection.FindOne(
			context.TODO(),
			bson.M{"$and": []bson.M{
				{"source.name": database.TaskSourceJIRA.Name},
				{"id_external": "42069"},
				{"user_id": userID},
			}},
		).Decode(&taskFromDB)
		assert.NoError(t, err)
		// ordering ID in DB isn't updated until task merge
		expectedTask.IDOrdering = 2
		expectedTask.IDTaskSection = IDTaskSectionBlocked
		assertTasksEqual(t, &expectedTask, &taskFromDB)
	})
	t.Run("NewPriorityReordered", func(t *testing.T) {
		userID, accountID := setupJIRA(t, externalAPITokenCollection, AtlassianSiteCollection)
		tokenServer := getTokenServerForJIRA(t, http.StatusOK)
		searchServer := getSearchServerForJIRA(t, http.StatusOK, false)

		dueDate, _ := time.Parse("2006-01-02", "2021-04-20")
		expectedTask := database.Task{
			TaskBase: database.TaskBase{
				IDOrdering:       2,
				IDExternal:       "42069",
				IDTaskSection:    IDTaskSectionToday,
				HasBeenReordered: true,
				Deeplink:         "https://dankmemes.com/browse/MOON-1969",
				Title:            "Sample Taskeroni",
				Source:           database.TaskSourceJIRA,
				UserID:           *userID,
			},
			PriorityID: "something_that_will_change",
			DueDate:    primitive.NewDateTimeFromTime(dueDate),
		}
		database.GetOrCreateTask(
			db,
			*userID,
			"42069",
			database.TaskSourceJIRA,
			&expectedTask,
		)

		var JIRATasks = make(chan TaskResult)
		go LoadJIRATasks(&API{JIRAConfigValues: JIRAConfig{APIBaseURL: &searchServer.URL, TokenURL: &tokenServer.URL}}, *userID, accountID, JIRATasks)
		result := <-JIRATasks
		assert.Equal(t, 1, len(result.Tasks))

		assertTasksEqual(t, &expectedTask, result.Tasks[0])

		var taskFromDB database.Task
		err := taskCollection.FindOne(
			context.TODO(),
			bson.M{"$and": []bson.M{
				{"source.name": database.TaskSourceJIRA.Name},
				{"id_external": "42069"},
				{"user_id": userID},
			}},
		).Decode(&taskFromDB)
		assert.NoError(t, err)
		assertTasksEqual(t, &expectedTask, &taskFromDB)
	})
}

func TestGetPriorities(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	prioritiesCollection := db.Collection("jira_priorities")

	userID, _ := setupJIRA(t, db.Collection("external_api_tokens"), db.Collection("jira_site_collection"))

	t.Run("ServerError", func(t *testing.T) {
		server := getJIRAPriorityServer(t, 400, []byte(``))
		defer server.Close()
		api := &API{JIRAConfigValues: JIRAConfig{PriorityListURL: &server.URL}}
		err := GetListOfJIRAPriorities(api, *userID, "sample")
		assert.Error(t, err)
	})

	t.Run("Success", func(t *testing.T) {
		server := getJIRAPriorityServer(t, 200, []byte(`[{"id": "9"},{"id": "5"}]`))
		defer server.Close()
		api := &API{JIRAConfigValues: JIRAConfig{PriorityListURL: &server.URL}}
		err := GetListOfJIRAPriorities(api, *userID, "sample")
		assert.NoError(t, err)

		options := options.Find()
		options.SetSort(bson.M{"integer_priority": 1})
		cursor, err := prioritiesCollection.Find(context.TODO(), bson.M{"user_id": userID}, options)
		assert.NoError(t, err)
		var priorities []database.JIRAPriority
		err = cursor.All(context.TODO(), &priorities)
		assert.NoError(t, err)
		assert.Equal(t, 2, len(priorities))
		assert.Equal(t, "9", priorities[0].JIRAID)
		assert.Equal(t, 1, priorities[0].IntegerPriority)
		assert.Equal(t, "5", priorities[1].JIRAID)
		assert.Equal(t, 2, priorities[1].IntegerPriority)

		server = getJIRAPriorityServer(t, http.StatusOK, []byte(`[{"id": "8"}]`))
		api = &API{JIRAConfigValues: JIRAConfig{PriorityListURL: &server.URL}}
		err = GetListOfJIRAPriorities(api, *userID, "sample")
		assert.NoError(t, err)

		cursor, err = prioritiesCollection.Find(context.TODO(), bson.M{"user_id": userID}, options)
		assert.NoError(t, err)
		err = cursor.All(context.TODO(), &priorities)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(priorities))
		assert.Equal(t, "8", priorities[0].JIRAID)
		assert.Equal(t, 1, priorities[0].IntegerPriority)
	})
}

func assertTasksEqual(t *testing.T, a *database.Task, b *database.Task) {
	assert.Equal(t, a.Deeplink, b.Deeplink)
	assert.Equal(t, a.IDExternal, b.IDExternal)
	assert.Equal(t, a.IDOrdering, b.IDOrdering)
	assert.Equal(t, a.IDTaskSection, b.IDTaskSection)
	assert.Equal(t, a.Title, b.Title)
	assert.Equal(t, a.Source, b.Source)
}

func setupJIRA(t *testing.T, externalAPITokenCollection *mongo.Collection, AtlassianSiteCollection *mongo.Collection) (*primitive.ObjectID, string) {
	userID, accountID := createJIRAToken(t, externalAPITokenCollection)
	createAtlassianSiteConfiguration(t, userID, AtlassianSiteCollection)
	return userID, accountID
}

func createJIRAToken(t *testing.T, externalAPITokenCollection *mongo.Collection) (*primitive.ObjectID, string) {
	userID := primitive.NewObjectID()
	accountID := primitive.NewObjectID().Hex()
	_, err := externalAPITokenCollection.InsertOne(
		context.Background(),
		&database.ExternalAPIToken{
			Source:    database.TaskSourceJIRA.Name,
			Token:     `{"access_token":"sample-token","refresh_token":"sample-token","scope":"sample-scope","expires_in":3600,"token_type":"Bearer"}`,
			UserID:    userID,
			AccountID: accountID,
		},
	)
	assert.NoError(t, err)
	return &userID, accountID
}

func createAtlassianSiteConfiguration(t *testing.T, userID *primitive.ObjectID, AtlassianSiteCollection *mongo.Collection) {
	_, err := AtlassianSiteCollection.UpdateOne(
		context.TODO(),
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

func getCloudIDServerForJIRA(t *testing.T, statusCode int, empty bool) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "Bearer sample-access-token", r.Header.Get("Authorization"))
		body, err := ioutil.ReadAll(r.Body)
		assert.NoError(t, err)
		assert.Equal(t, "", string(body))
		w.WriteHeader(statusCode)
		if empty {
			w.Write([]byte(`[]`))
		} else {
			w.Write([]byte(`[{"id": "teslatothemoon42069", "url": "https://dankmemes.com", "name": "The dungeon"}]`))
		}
	}))
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
				Fields: JIRATaskFields{DueDate: "2021-04-20", Summary: "Sample Taskeroni"},
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

func getTransitionIDServerForJIRA(t *testing.T) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, r.RequestURI, "/rest/api/3/issue/sample_jira_id/transitions")
		if r.Method == "GET" {
			w.WriteHeader(200)
			w.Write([]byte(`{"transitions": [{"id": "100"}]}`))
		} else if r.Method == "POST" {
			body, err := ioutil.ReadAll(r.Body)
			assert.NoError(t, err)
			assert.Equal(t, "{\"transition\": {\"id\": \"100\"}}", string(body))
			w.WriteHeader(204)
		} else {
			w.WriteHeader(400)
		}
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
