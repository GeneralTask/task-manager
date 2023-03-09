package external

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/testutils"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestLoadLinearTasks(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	taskCollection := database.GetTaskCollection(db)
	userID := primitive.NewObjectID()

	taskServerSuccess := testutils.GetMockAPIServer(t, 200, `{
		"data": {
			"issues": {
				"nodes": [
					{
						"id": "test-issue-id-1",
						"title": "test title",
						"description": "test description",
						"url": "https://example.com/",
						"createdAt": "2022-06-06T23:13:24.037Z",
						"priority": 3.0,
						"state": {
							"id": "state-id",
							"name": "Todo",
							"type": "started"
						},
						"team": {
							"id": "Backend",
							"name": "Backend",
							"mergeWorkflowState": {
								"name": "Done",
								"id": "merge-workflow-state-id",
								"type": "completed"
							}
						},
						"comments": {
							"nodes": [
								{
									"id": "example external id",
									"body": "test comment body",
									"createdAt": "2019-04-21T00:00:00.000Z",
									"user": {
										"id": "test-commenter-id",
										"name": "Test Commenter",
										"displayName": "test comm",
										"email": "testCommenter@generaltask.com"
									}
								}
							]
						},
						"cycle": {
							"id": "cycle-id",
							"name": "test cycle",
							"number": 420,
							"startsAt": "2016-04-20T00:00:00.000Z",
							"endsAt": "2016-04-21T00:00:00.000Z"
						}
					}
				]
			}
		}
	}`)
	userInfoServerSuccess := testutils.GetMockAPIServer(t, 200, `{"data": {
			"viewer": {
				"id": "6942069420",
				"name": "Test User",
				"displayName": "Test Display Name",
				"email": "test@generaltask.com"
			}
		}}`)
	linearStatusServerSuccess := testutils.GetMockAPIServer(t, 200, `{"data": {
			"workflowStates": {
				"nodes": [
					{
						"id": "6942069419",
						"name": "Triage",
						"type": "triage",
						"team": {
							"name": "Backend"
						}
					},
					{
						"id": "6942069420",
						"name": "Todo",
						"type": "started",
						"team": {
							"name": "Backend"
						}
					},
					{
						"id": "6942069421",
						"name": "In Progress",
						"type": "started",
						"team": {
							"name": "Backend"
						}
					}
				]
			}
		}}`)

	t.Run("BadUserInfoStatusCode", func(t *testing.T) {
		userInfoServer := testutils.GetMockAPIServer(t, 400, "")
		defer userInfoServer.Close()
		linearTask := LinearTaskSource{Linear: LinearService{
			Config: LinearConfig{
				ConfigValues: LinearConfigValues{
					UserInfoURL: &userInfoServer.URL,
				},
			},
		}}

		var taskResult = make(chan TaskResult)
		go linearTask.GetTasks(db, userID, "sample_account@email.com", taskResult)
		result := <-taskResult
		assert.NotEqual(t, nil, result.Error)
		assert.Equal(t, `non-200 OK status code: 400 Bad Request body: ""`, result.Error.Error())
		assert.Equal(t, 0, len(result.Tasks))
	})
	t.Run("BadUserInfoResponse", func(t *testing.T) {
		userInfoServer := testutils.GetMockAPIServer(t, 200, `oopsie poopsie`)
		defer userInfoServer.Close()
		linearTask := LinearTaskSource{Linear: LinearService{
			Config: LinearConfig{
				ConfigValues: LinearConfigValues{
					UserInfoURL: &userInfoServer.URL,
				},
			},
		}}

		var taskResult = make(chan TaskResult)
		go linearTask.GetTasks(db, userID, "sample_account@email.com", taskResult)
		result := <-taskResult
		assert.NotEqual(t, nil, result.Error)
		assert.Equal(t, "invalid character 'o' looking for beginning of value", result.Error.Error())
		assert.Equal(t, 0, len(result.Tasks))
	})
	t.Run("BadTaskStatusCode", func(t *testing.T) {
		taskServer := testutils.GetMockAPIServer(t, 409, ``)
		defer taskServer.Close()
		linearTask := LinearTaskSource{Linear: LinearService{
			Config: LinearConfig{
				ConfigValues: LinearConfigValues{
					UserInfoURL:  &userInfoServerSuccess.URL,
					TaskFetchURL: &taskServer.URL,
				},
			},
		}}

		var taskResult = make(chan TaskResult)
		go linearTask.GetTasks(db, userID, "sample_account@email.com", taskResult)
		result := <-taskResult
		assert.NotEqual(t, nil, result.Error)
		assert.Equal(t, `non-200 OK status code: 409 Conflict body: ""`, result.Error.Error())
		assert.Equal(t, 0, len(result.Tasks))
	})
	t.Run("BadTaskResponse", func(t *testing.T) {
		taskServer := testutils.GetMockAPIServer(t, 200, `to the moon`)
		defer taskServer.Close()
		linearTask := LinearTaskSource{Linear: LinearService{
			Config: LinearConfig{
				ConfigValues: LinearConfigValues{
					UserInfoURL:  &userInfoServerSuccess.URL,
					TaskFetchURL: &taskServer.URL,
				},
			},
		}}

		var taskResult = make(chan TaskResult)
		go linearTask.GetTasks(db, userID, "sample_account@email.com", taskResult)
		result := <-taskResult
		assert.NotEqual(t, nil, result.Error)
		assert.Equal(t, "invalid character 'o' in literal true (expecting 'r')", result.Error.Error())
		assert.Equal(t, 0, len(result.Tasks))
	})
	t.Run("BadWorkflowStates", func(t *testing.T) {
		linearBadStatusServer := testutils.GetMockAPIServer(t, 200, `{"data": {
			"workflowStates": {
				"nodes": [
					{
						"id": "6942069420",
						"name": "Todo",
						"type": "started",
						"team": {
							"name": "Ooopsie"
						}
					}
				]
			}
		}}`)
		linearTask := LinearTaskSource{Linear: LinearService{
			Config: LinearConfig{
				ConfigValues: LinearConfigValues{
					UserInfoURL:    &userInfoServerSuccess.URL,
					TaskFetchURL:   &taskServerSuccess.URL,
					StatusFetchURL: &linearBadStatusServer.URL,
				},
			},
		}}

		var taskResult = make(chan TaskResult)
		go linearTask.GetTasks(db, userID, "sample_account@email.com", taskResult)
		result := <-taskResult

		assert.Error(t, result.Error)
		assert.Equal(t, "could not match team with status", result.Error.Error())
		assert.Equal(t, 0, len(result.Tasks))
	})
	t.Run("Success", func(t *testing.T) {
		user := database.User{
			ID:                userID,
			Email:             "email@gmail.com",
			LinearName:        "linearName",
			LinearDisplayName: "linearDisplayName",
		}
		database.GetUserCollection(db).InsertOne(context.Background(), user)

		linearTask := LinearTaskSource{Linear: LinearService{
			Config: LinearConfig{
				ConfigValues: LinearConfigValues{
					UserInfoURL:    &userInfoServerSuccess.URL,
					TaskFetchURL:   &taskServerSuccess.URL,
					StatusFetchURL: &linearStatusServerSuccess.URL,
				},
			},
		}}

		createdAt, _ := time.Parse(constants.YEAR_MONTH_DAY_FORMAT, "2019-04-20")
		commentCreatedAt, _ := time.Parse(constants.YEAR_MONTH_DAY_FORMAT, "2019-04-21")
		title := "test title"
		description := "test description"
		dueDate := primitive.NewDateTimeFromTime(time.Unix(0, 0))
		priority := 3.0
		cycleStartsAt, _ := time.Parse("2006-01-02T15:04:05.000Z", "2016-04-20T00:00:00.000Z")
		cycleEndsAt, _ := time.Parse("2006-01-02T15:04:05.000Z", "2016-04-21T00:00:00.000Z")
		expectedTask := database.Task{
			IDOrdering:         0,
			IDExternal:         "test-issue-id-1",
			IDTaskSection:      constants.IDTaskSectionDefault,
			Deeplink:           "https://example.com/",
			Title:              &title,
			Body:               &description,
			SourceID:           TASK_SOURCE_ID_LINEAR,
			SourceAccountID:    "wrong",
			UserID:             userID,
			DueDate:            &dueDate,
			CreatedAtExternal:  primitive.NewDateTimeFromTime(createdAt),
			PriorityNormalized: &priority,
			Status: &database.ExternalTaskStatus{
				ExternalID: "state-id",
				State:      "Todo",
				Type:       "started",
			},
			CompletedStatus: &database.ExternalTaskStatus{
				ExternalID: "merge-workflow-state-id",
				State:      "Done",
				Type:       "completed",
			},
			Comments: &[]database.Comment{
				{
					ExternalID: "example external id",
					Body:       "test comment body",
					User: database.ExternalUser{
						ExternalID:  "test-commenter-id",
						Name:        "Test Commenter",
						DisplayName: "test comm",
						Email:       "testCommenter@generaltask.com",
					},
					CreatedAt: primitive.NewDateTimeFromTime(commentCreatedAt),
				},
			},
			LinearCycle: database.LinearCycle{
				ID:       "cycle-id",
				Name:     "test cycle",
				Number:   float32(420),
				StartsAt: primitive.NewDateTimeFromTime(cycleStartsAt),
				EndsAt:   primitive.NewDateTimeFromTime(cycleEndsAt),
			},
		}

		var taskResult = make(chan TaskResult)
		go linearTask.GetTasks(db, userID, "sample_account@email.com", taskResult)
		result := <-taskResult
		assert.NoError(t, result.Error)
		assert.Equal(t, 1, len(result.Tasks))
		assertTasksEqual(t, &expectedTask, result.Tasks[0])
		assert.Equal(t, expectedTask.Status, result.Tasks[0].Status)
		assert.True(t, (expectedTask.Comments == nil) == (result.Tasks[0].Comments == nil))
		if (expectedTask.Comments != nil) && (result.Tasks[0].Comments != nil) {
			expectedComments := *expectedTask.Comments
			actualComments := *result.Tasks[0].Comments
			assert.Equal(t, len(expectedComments), len(actualComments))
			if len(*expectedTask.Comments) == len(*result.Tasks[0].Comments) {
				assert.Equal(t, expectedComments, actualComments)
			}
		}

		var taskFromDB database.Task
		err := taskCollection.FindOne(
			context.Background(),
			bson.M{"user_id": userID},
		).Decode(&taskFromDB)
		assert.NoError(t, err)
		assertTasksEqual(t, &expectedTask, &taskFromDB)
		assert.Equal(t, "sample_account@email.com", taskFromDB.SourceAccountID) // doesn't get updated
		assert.Equal(t, "Triage", taskFromDB.AllStatuses[2].State)

		var userObject database.User
		err = database.GetUserCollection(db).FindOne(context.Background(), bson.M{"_id": userID}).Decode(&userObject)
		assert.NoError(t, err)
		assert.Equal(t, "Test User", userObject.LinearName)
		assert.Equal(t, "Test Display Name", userObject.LinearDisplayName)
		assert.Equal(t, "email@gmail.com", userObject.Email)
	})
	t.Run("SuccessUserNotCreated", func(t *testing.T) {
		linearTask := LinearTaskSource{Linear: LinearService{
			Config: LinearConfig{
				ConfigValues: LinearConfigValues{
					UserInfoURL:    &userInfoServerSuccess.URL,
					TaskFetchURL:   &taskServerSuccess.URL,
					StatusFetchURL: &linearStatusServerSuccess.URL,
				},
			},
		}}

		newUserID := primitive.NewObjectID()
		var taskResult = make(chan TaskResult)
		go linearTask.GetTasks(db, newUserID, "sample_account@email.com", taskResult)
		result := <-taskResult
		assert.NoError(t, result.Error)
		var userObject database.User
		err = database.GetUserCollection(db).FindOne(context.Background(), bson.M{"_id": newUserID}).Decode(&userObject)
		assert.Error(t, err)
	})
	t.Run("SuccessExistingTask", func(t *testing.T) {
		linearTask := LinearTaskSource{Linear: LinearService{
			Config: LinearConfig{
				ConfigValues: LinearConfigValues{
					UserInfoURL:    &userInfoServerSuccess.URL,
					TaskFetchURL:   &taskServerSuccess.URL,
					StatusFetchURL: &linearStatusServerSuccess.URL,
				},
			},
		}}

		createdAt, _ := time.Parse(constants.YEAR_MONTH_DAY_FORMAT, "2019-04-20")
		commentCreatedAt, _ := time.Parse(constants.YEAR_MONTH_DAY_FORMAT, "2019-04-21")
		completed := true
		title := "wrong test title"
		description := "wrong test description"
		priority := 3.0
		dueDate := primitive.NewDateTimeFromTime(time.Unix(0, 0))
		cycleStartsAt, _ := time.Parse("2006-01-02T15:04:05.000Z", "2016-04-20T00:00:00.000Z")
		cycleEndsAt, _ := time.Parse("2006-01-02T15:04:05.000Z", "2016-04-21T00:00:00.000Z")
		expectedTask := database.Task{
			IDOrdering:         0,
			IDExternal:         "test-issue-id-1",
			IDTaskSection:      constants.IDTaskSectionDefault,
			IsCompleted:        &completed,
			Deeplink:           "https://example.com/",
			Title:              &title,
			Body:               &description,
			SourceID:           TASK_SOURCE_ID_LINEAR,
			SourceAccountID:    "sample_account@email.com",
			UserID:             userID,
			DueDate:            &dueDate,
			PriorityNormalized: &priority,
			CreatedAtExternal:  primitive.NewDateTimeFromTime(createdAt),
			Status: &database.ExternalTaskStatus{
				ExternalID: "state-id",
				State:      "Todo",
				Type:       "started",
			},
			CompletedStatus: &database.ExternalTaskStatus{
				ExternalID: "merge-workflow-state-id",
				State:      "Done",
				Type:       "completed",
			},
			Comments: nil,
			LinearCycle: database.LinearCycle{
				ID:       "cycle-id",
				Name:     "test cycle",
				Number:   float32(420),
				StartsAt: primitive.NewDateTimeFromTime(cycleStartsAt),
				EndsAt:   primitive.NewDateTimeFromTime(cycleEndsAt),
			},
		}
		// need to update, because the previous test case has already created this task
		database.UpdateOrCreateTask(
			db,
			userID,
			"test-issue-id-1",
			TASK_SOURCE_ID_LINEAR,
			expectedTask,
			expectedTask,
			nil,
		)
		// switch a few fields from their existing db value to their expected output value
		testTitle := "test title"
		testDescription := "test description"
		expectedTask.Title = &testTitle
		expectedTask.Body = &testDescription
		expectedTask.Comments = &[]database.Comment{
			{
				ExternalID: "example external id",
				Body:       "test comment body",
				User: database.ExternalUser{
					ExternalID:  "test-commenter-id",
					Name:        "Test Commenter",
					DisplayName: "test comm",
					Email:       "testCommenter@generaltask.com",
				},
				CreatedAt: primitive.NewDateTimeFromTime(commentCreatedAt),
			},
		}

		var taskResult = make(chan TaskResult)
		go linearTask.GetTasks(db, userID, "sample_account@email.com", taskResult)
		result := <-taskResult
		assert.NoError(t, result.Error)
		assert.Equal(t, 1, len(result.Tasks))
		assertTasksEqual(t, &expectedTask, result.Tasks[0])
		assert.False(t, *result.Tasks[0].IsCompleted)

		var taskFromDB database.Task
		err := taskCollection.FindOne(
			context.Background(),
			bson.M{"user_id": userID},
		).Decode(&taskFromDB)
		assert.NoError(t, err)
		assertTasksEqual(t, &expectedTask, &taskFromDB)
		assert.False(t, *taskFromDB.IsCompleted)
		assert.Equal(t, "sample_account@email.com", taskFromDB.SourceAccountID) // doesn't get updated
	})
}

func TestLoadLinearTaskCycles(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := primitive.NewObjectID()

	userInfoServerSuccess := testutils.GetMockAPIServer(t, 200, `{"data": {
		"viewer": {
			"id": "6942069420",
			"name": "Test User",
			"displayName": "Test Display Name",
			"email": "test@generaltask.com"
		}
	}}`)
	linearStatusServerSuccess := testutils.GetMockAPIServer(t, 200, `{"data": {
		"workflowStates": {
			"nodes": [
				{
					"id": "6942069419",
					"name": "Triage",
					"type": "triage",
					"team": {
						"name": "Backend"
					}
				},
				{
					"id": "6942069420",
					"name": "Todo",
					"type": "started",
					"team": {
						"name": "Backend"
					}
				},
				{
					"id": "6942069421",
					"name": "In Progress",
					"type": "started",
					"team": {
						"name": "Backend"
					}
				}
			]
		}
	}}`)
	baseLinearIssuesQueryResponse := `{
		"data": {
			"issues": {
				"nodes": [
					{
						"id": "test id",
						"title": "test title",
						"description": "test description",
						"url": "https://example.com/",
						"createdAt": "2022-06-06T23:13:24.037Z",
						"priority": 3.0,
						"state": {
							"id": "state-id",
							"name": "Todo",
							"type": "started"
						},
						"team": {
							"id": "Backend",
							"name": "Backend",
							"mergeWorkflowState": {
								"name": "Done",
								"id": "merge-workflow-state-id",
								"type": "completed"
							}
						},
						"comments": {
							"nodes": [
								{
									"id": "example external id",
									"body": "test comment body",
									"createdAt": "2019-04-21T00:00:00.000Z",
									"user": {
										"id": "test-commenter-id",
										"name": "Test Commenter",
										"displayName": "test comm",
										"email": "testCommenter@generaltask.com"
									}
								}
							]
						},
						"cycle": %s
					}
				]
			},
			"activeCycles": {
				"nodes": [
					{
						"number": 420,
						"team": {
							"id": "Backend"
						}
					},
					{
						"number": 69,
						"team": {
							"id": "Other team ID"
						}
					}
				]
			},
			"previousCycles": {
				"nodes": [
					{
						"number": 419,
						"team": {
							"id": "Backend"
						}
					},
					{
						"number": 68,
						"team": {
							"id": "Other team ID"
						}
					}
				]
			},
			"nextCycles": {
				"nodes": [
					{
						"number": 421,
						"team": {
							"id": "Backend"
						}
					},
					{
						"number": 71,
						"team": {
							"id": "Other team ID"
						}
					}
				]
			}
		}
	}`

	getLinearTaskWithCycles := func(taskCycle string) *database.Task {
		taskServerSuccess := testutils.GetMockAPIServer(t, 200, fmt.Sprintf(baseLinearIssuesQueryResponse, taskCycle))

		linearTaskSource := LinearTaskSource{Linear: LinearService{
			Config: LinearConfig{
				ConfigValues: LinearConfigValues{
					UserInfoURL:    &userInfoServerSuccess.URL,
					TaskFetchURL:   &taskServerSuccess.URL,
					StatusFetchURL: &linearStatusServerSuccess.URL,
				},
			},
		}}
		var taskResult = make(chan TaskResult)
		go linearTaskSource.GetTasks(db, userID, "sample_account@email.com", taskResult)
		result := <-taskResult
		assert.NoError(t, result.Error)
		assert.Equal(t, 1, len(result.Tasks))
		return result.Tasks[0]
	}

	startsAt, _ := time.Parse(time.RFC3339, "2023-03-13T07:00:00.000Z")
	endsAt, _ := time.Parse(time.RFC3339, "2023-03-20T07:00:00.000Z")

	t.Run("NoCycle", func(t *testing.T) {
		task := getLinearTaskWithCycles("null")
		expectedCycle := database.LinearCycle{}
		assertLinearCyclesEqual(t, expectedCycle, task.LinearCycle)
	})
	t.Run("CurrentCycle", func(t *testing.T) {
		taskCycleResponse := `{
			"id": "cycle-id",
			"name": "cycle name",
			"number": 420,
			"startsAt": "2023-03-13T07:00:00.000Z",
			"endsAt": "2023-03-20T07:00:00.000Z"
		}`

		task := getLinearTaskWithCycles(taskCycleResponse)
		expectedCycle := database.LinearCycle{
			ID:             "cycle-id",
			Name:           "cycle name",
			Number:         420,
			StartsAt:       primitive.NewDateTimeFromTime(startsAt),
			EndsAt:         primitive.NewDateTimeFromTime(endsAt),
			IsCurrentCycle: true,
		}
		assertLinearCyclesEqual(t, expectedCycle, task.LinearCycle)
	})
	t.Run("PreviousCycle", func(t *testing.T) {
		taskCycleResponse := `{
			"id": "cycle-id",
			"name": "cycle name",
			"number": 419,
			"startsAt": "2023-03-13T07:00:00.000Z",
			"endsAt": "2023-03-20T07:00:00.000Z"
		}`

		task := getLinearTaskWithCycles(taskCycleResponse)
		expectedCycle := database.LinearCycle{
			ID:              "cycle-id",
			Name:            "cycle name",
			Number:          419,
			StartsAt:        primitive.NewDateTimeFromTime(startsAt),
			EndsAt:          primitive.NewDateTimeFromTime(endsAt),
			IsPreviousCycle: true,
		}
		assertLinearCyclesEqual(t, expectedCycle, task.LinearCycle)
	})
	t.Run("NextCycle", func(t *testing.T) {
		taskCycleResponse := `{
			"id": "cycle-id",
			"name": "cycle name",
			"number": 421,
			"startsAt": "2023-03-13T07:00:00.000Z",
			"endsAt": "2023-03-20T07:00:00.000Z"
		}`

		task := getLinearTaskWithCycles(taskCycleResponse)
		expectedCycle := database.LinearCycle{
			ID:          "cycle-id",
			Name:        "cycle name",
			Number:      421,
			StartsAt:    primitive.NewDateTimeFromTime(startsAt),
			EndsAt:      primitive.NewDateTimeFromTime(endsAt),
			IsNextCycle: true,
		}
		assertLinearCyclesEqual(t, expectedCycle, task.LinearCycle)
	})
	t.Run("TwoCyclesAgo", func(t *testing.T) {
		taskCycleResponse := `{
			"id": "cycle-id",
			"name": "cycle name",
			"number": 418,
			"startsAt": "2023-03-13T07:00:00.000Z",
			"endsAt": "2023-03-20T07:00:00.000Z"
		}`

		task := getLinearTaskWithCycles(taskCycleResponse)
		expectedCycle := database.LinearCycle{
			ID:       "cycle-id",
			Name:     "cycle name",
			Number:   418,
			StartsAt: primitive.NewDateTimeFromTime(startsAt),
			EndsAt:   primitive.NewDateTimeFromTime(endsAt),
		}
		assertLinearCyclesEqual(t, expectedCycle, task.LinearCycle)
	})
	t.Run("TwoCyclesInTheFuture", func(t *testing.T) {
		taskCycleResponse := `{
			"id": "cycle-id",
			"name": "cycle name",
			"number": 422,
			"startsAt": "2023-03-13T07:00:00.000Z",
			"endsAt": "2023-03-20T07:00:00.000Z"
		}`

		task := getLinearTaskWithCycles(taskCycleResponse)
		expectedCycle := database.LinearCycle{
			ID:       "cycle-id",
			Name:     "cycle name",
			Number:   422,
			StartsAt: primitive.NewDateTimeFromTime(startsAt),
			EndsAt:   primitive.NewDateTimeFromTime(endsAt),
		}
		assertLinearCyclesEqual(t, expectedCycle, task.LinearCycle)
	})
	t.Run("CycleNumberWrongTeam", func(t *testing.T) {
		taskCycleResponse := `{
			"id": "cycle-id",
			"name": "cycle name",
			"number": 69,
			"startsAt": "2023-03-13T07:00:00.000Z",
			"endsAt": "2023-03-20T07:00:00.000Z"
		}`

		task := getLinearTaskWithCycles(taskCycleResponse)
		expectedCycle := database.LinearCycle{
			ID:       "cycle-id",
			Name:     "cycle name",
			Number:   69,
			StartsAt: primitive.NewDateTimeFromTime(startsAt),
			EndsAt:   primitive.NewDateTimeFromTime(endsAt),
		}
		assertLinearCyclesEqual(t, expectedCycle, task.LinearCycle)
	})
}

func TestModifyLinearTask(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	taskCollection := database.GetTaskCollection(db)

	userID := primitive.NewObjectID()
	createdAt, _ := time.Parse(constants.YEAR_MONTH_DAY_FORMAT, "2019-04-20")
	completed := true
	testTitle := "test title"
	testDescription := "test description"
	_true := true
	_false := false
	dueDate := primitive.NewDateTimeFromTime(time.Time{})
	expectedTask := database.Task{
		IDOrdering:        0,
		IDExternal:        "test-issue-id-1",
		IDTaskSection:     constants.IDTaskSectionDefault,
		IsCompleted:       &completed,
		Deeplink:          "https://example.com/",
		Title:             &testTitle,
		Body:              &testDescription,
		SourceID:          TASK_SOURCE_ID_LINEAR,
		SourceAccountID:   "sample_account@email.com",
		UserID:            userID,
		DueDate:           &dueDate,
		CreatedAtExternal: primitive.NewDateTimeFromTime(createdAt),
		Status: &database.ExternalTaskStatus{
			ExternalID: "merge-workflow-state-id",
			State:      "Done",
			Type:       "completed",
		},
		PreviousStatus: &database.ExternalTaskStatus{
			ExternalID: "state-id",
			State:      "Todo",
			Type:       "started",
		},
		CompletedStatus: &database.ExternalTaskStatus{
			ExternalID: "merge-workflow-state-id",
			State:      "Done",
			Type:       "completed",
		},
		Comments: nil,
	}
	database.GetOrCreateTask(
		db,
		userID,
		"test-issue-id-1",
		TASK_SOURCE_ID_LINEAR,
		&expectedTask,
	)

	t.Run("MarkAsDoneBadResponse", func(t *testing.T) {
		taskUpdateServer := testutils.GetMockAPIServer(t, 400, "")
		defer taskUpdateServer.Close()
		linearTask := LinearTaskSource{Linear: LinearService{
			Config: LinearConfig{
				ConfigValues: LinearConfigValues{
					TaskUpdateURL: &taskUpdateServer.URL,
				},
			},
		}}

		isCompleted := true
		err := linearTask.ModifyTask(db, userID, "sample_account@email.com", "6942069420", &database.Task{IsCompleted: &isCompleted}, &database.Task{})
		assert.NotEqual(t, nil, err)
		assert.Equal(t, `decoding response: EOF`, err.Error())
	})
	t.Run("UpdateFieldsAndMarkAsDoneSuccess", func(t *testing.T) {
		taskUpdateServer := testutils.GetMockAPIServer(t, 200, `{"data": {"issueUpdate": {"success": true}}}`)
		defer taskUpdateServer.Close()
		linearTask := LinearTaskSource{Linear: LinearService{
			Config: LinearConfig{
				ConfigValues: LinearConfigValues{
					TaskUpdateURL: &taskUpdateServer.URL,
				},
			},
		}}

		newName := "New Title"
		newBody := "New Body"
		newDueDate, err := time.Parse(constants.YEAR_MONTH_DAY_FORMAT, "2022-09-12")
		assert.NoError(t, err)
		dueDatePrimitive := primitive.NewDateTimeFromTime(newDueDate)
		priority := 3.0
		err = linearTask.ModifyTask(db, userID, "sample_account@email.com", "6942069420", &database.Task{
			Title:              &newName,
			Body:               &newBody,
			DueDate:            &dueDatePrimitive,
			PriorityNormalized: &priority,
		}, nil)
		assert.NoError(t, err)
	})
	t.Run("UpdateFieldsAndMarkAsDoneBadResponse", func(t *testing.T) {
		taskUpdateServer := testutils.GetMockAPIServer(t, 400, "")
		defer taskUpdateServer.Close()
		linearTask := LinearTaskSource{Linear: LinearService{
			Config: LinearConfig{
				ConfigValues: LinearConfigValues{
					TaskUpdateURL: &taskUpdateServer.URL,
				},
			},
		}}

		newName := "New Title"
		newBody := "New Body"
		isCompleted := true

		err := linearTask.ModifyTask(db, userID, "sample_account@email.com", "6942069420", &database.Task{
			Title:       &newName,
			Body:        &newBody,
			IsCompleted: &isCompleted,
		}, &database.Task{})
		assert.NotEqual(t, nil, err)
		assert.Equal(t, `decoding response: EOF`, err.Error())
	})
	t.Run("UpdateTitleBodySuccess", func(t *testing.T) {
		taskUpdateServer := testutils.GetMockAPIServer(t, 200, `{"data": {"issueUpdate": {"success": true}}}`)
		defer taskUpdateServer.Close()
		linearTask := LinearTaskSource{Linear: LinearService{
			Config: LinearConfig{
				ConfigValues: LinearConfigValues{
					TaskUpdateURL: &taskUpdateServer.URL,
				},
			},
		}}

		newName := "New Title"
		newBody := "New Body"
		dueDate := primitive.NewDateTimeFromTime(time.Time{})
		err := linearTask.ModifyTask(db, userID, "sample_account@email.com", "6942069420", &database.Task{
			Title:   &newName,
			Body:    &newBody,
			DueDate: &dueDate,
		}, nil)
		assert.NoError(t, err)
	})
	t.Run("UpdateEmptyDescriptionSuccess", func(t *testing.T) {
		taskUpdateServer := testutils.GetMockAPIServer(t, 200, `{"data": {"issueUpdate": {"success": true}}}`)
		defer taskUpdateServer.Close()
		linearTask := LinearTaskSource{Linear: LinearService{
			Config: LinearConfig{
				ConfigValues: LinearConfigValues{
					TaskUpdateURL: &taskUpdateServer.URL,
				},
			},
		}}

		newName := "New Title"
		newBody := ""
		dueDate := primitive.NewDateTimeFromTime(time.Time{})

		err := linearTask.ModifyTask(db, userID, "sample_account@email.com", "6942069420", &database.Task{
			Title:   &newName,
			Body:    &newBody,
			DueDate: &dueDate,
		}, nil)
		assert.NoError(t, err)
	})
	t.Run("UpdateEmptyTitleFails", func(t *testing.T) {
		taskUpdateServer := testutils.GetMockAPIServer(t, 200, `{"data": {"issueUpdate": {"success": true}}}`)
		defer taskUpdateServer.Close()
		linearTask := LinearTaskSource{Linear: LinearService{
			Config: LinearConfig{
				ConfigValues: LinearConfigValues{
					TaskUpdateURL: &taskUpdateServer.URL,
				},
			},
		}}

		newName := ""
		newBody := "New Body"
		dueDate := primitive.NewDateTimeFromTime(time.Time{})

		err := linearTask.ModifyTask(db, userID, "sample_account@email.com", "6942069420", &database.Task{
			Title:   &newName,
			Body:    &newBody,
			DueDate: &dueDate,
		}, nil)
		assert.EqualErrorf(t, err, err.Error(), "cannot set linear issue title to empty string")
	})
	t.Run("UpdateTitleBodyBadResponse", func(t *testing.T) {
		taskUpdateServer := testutils.GetMockAPIServer(t, 400, "")
		defer taskUpdateServer.Close()
		linearTask := LinearTaskSource{Linear: LinearService{
			Config: LinearConfig{
				ConfigValues: LinearConfigValues{
					TaskUpdateURL: &taskUpdateServer.URL,
				},
			},
		}}

		newName := "New Title"
		newBody := "New Body"
		dueDate := primitive.NewDateTimeFromTime(time.Time{})

		err := linearTask.ModifyTask(db, userID, "sample_account@email.com", "6942069420", &database.Task{
			Title:   &newName,
			Body:    &newBody,
			DueDate: &dueDate,
		}, nil)
		assert.NotEqual(t, nil, err)
		assert.Equal(t, `decoding response: EOF`, err.Error())
	})
	t.Run("UpdateFieldsMarkAsNotDoneSuccess", func(t *testing.T) {
		response := `{"data": {"issueUpdate": {
				"success": true,
					"issue": {
					"id": "1c3b11d7-9298-4cc3-8a4a-d2d6d4677315",
						"title": "test title",
						"description": "test description",
						"state": {
						"id": "39e87303-2b42-4c71-bfbe-4afb7bb7eecb",
							"name": "Todo"
					}}}}}`
		taskUpdateServer := testutils.GetMockAPIServer(t, 200, response)
		defer taskUpdateServer.Close()
		linearTask := LinearTaskSource{Linear: LinearService{
			Config: LinearConfig{
				ConfigValues: LinearConfigValues{
					TaskUpdateURL: &taskUpdateServer.URL,
				},
			},
		}}

		newName := "New Title"
		newBody := "New Body"
		isCompleted := false
		dueDate := primitive.NewDateTimeFromTime(time.Unix(0, 0))

		err := linearTask.ModifyTask(db, userID, "sample_account@email.com", "6942069420", &database.Task{
			Title:       &newName,
			Body:        &newBody,
			DueDate:     &dueDate,
			IsCompleted: &isCompleted,
		}, &expectedTask)
		assert.NoError(t, err)
	})

	t.Run("UpdateFieldsMarkAsNotDoneBadResponse", func(t *testing.T) {
		taskUpdateServer := testutils.GetMockAPIServer(t, 400, "")
		defer taskUpdateServer.Close()
		linearTask := LinearTaskSource{Linear: LinearService{
			Config: LinearConfig{
				ConfigValues: LinearConfigValues{
					TaskUpdateURL: &taskUpdateServer.URL,
				},
			},
		}}

		newName := "New Title"
		newBody := "New Body"
		isCompleted := false
		dueDate := primitive.NewDateTimeFromTime(time.Time{})

		var taskFromDB database.Task
		err = taskCollection.FindOne(
			context.Background(),
			bson.M{"user_id": userID},
		).Decode(&taskFromDB)
		err := linearTask.ModifyTask(db, userID, "sample_account@email.com", "6942069420", &database.Task{
			Title:       &newName,
			Body:        &newBody,
			DueDate:     &dueDate,
			IsCompleted: &isCompleted,
		}, &expectedTask)
		assert.NotEqual(t, nil, err)
		assert.Equal(t, "decoding response: EOF", err.Error())
	})
	t.Run("MarkAsDeletedSuccess", func(t *testing.T) {
		taskUpdateServer := testutils.GetMockAPIServer(t, 200, `{"data": {"issueArchive": {"success": true}}}`)
		defer taskUpdateServer.Close()
		var linearTask LinearTaskSource
		linearTask.Linear.Config.ConfigValues.TaskUpdateURL = &taskUpdateServer.URL

		err = linearTask.ModifyTask(db, userID, "sample_account@email.com", "6942069420", &database.Task{
			IsDeleted: &_true,
		}, nil)
		assert.NoError(t, err)
	})
	t.Run("MarkAsDeletedFail", func(t *testing.T) {
		taskUpdateServer := testutils.GetMockAPIServer(t, 200, `{"data": {"issueArchive": {"success": false}}}`)
		defer taskUpdateServer.Close()
		linearTask := LinearTaskSource{Linear: LinearService{
			Config: LinearConfig{
				ConfigValues: LinearConfigValues{
					TaskUpdateURL: &taskUpdateServer.URL,
				},
			},
		}}

		err = linearTask.ModifyTask(db, userID, "sample_account@email.com", "6942069420", &database.Task{
			IsDeleted: &_true,
		}, nil)
		assert.Error(t, err)
		assert.Equal(t, "linear mutation failed to update issue", err.Error())
	})
	t.Run("MarkAsUndeletedSuccess", func(t *testing.T) {
		taskUpdateServer := testutils.GetMockAPIServer(t, 200, `{"data": {"issueUnarchive": {"success": true}}}`)
		defer taskUpdateServer.Close()
		var linearTask LinearTaskSource
		linearTask.Linear.Config.ConfigValues.TaskUpdateURL = &taskUpdateServer.URL

		err = linearTask.ModifyTask(db, userID, "sample_account@email.com", "6942069420", &database.Task{
			IsDeleted: &_false,
		}, nil)
		assert.NoError(t, err)
	})
	t.Run("MarkAsUndeletedFail", func(t *testing.T) {
		taskUpdateServer := testutils.GetMockAPIServer(t, 200, `{"data": {"issueUnarchive": {"success": false}}}`)
		defer taskUpdateServer.Close()
		linearTask := LinearTaskSource{Linear: LinearService{
			Config: LinearConfig{
				ConfigValues: LinearConfigValues{
					TaskUpdateURL: &taskUpdateServer.URL,
				},
			},
		}}

		err = linearTask.ModifyTask(db, userID, "sample_account@email.com", "6942069420", &database.Task{
			IsDeleted: &_false,
		}, nil)
		assert.Error(t, err)
		assert.Equal(t, "linear mutation failed to update issue", err.Error())
	})
}

func TestAddComment(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	userID := primitive.NewObjectID()

	t.Run("AddCommentFailed", func(t *testing.T) {
		taskUpdateServer := testutils.GetMockAPIServer(t, 200, `{"data": {"issueUpdate": {"success": false}}}`)
		defer taskUpdateServer.Close()
		linearTask := LinearTaskSource{Linear: LinearService{
			Config: LinearConfig{
				ConfigValues: LinearConfigValues{
					TaskUpdateURL: &taskUpdateServer.URL,
				},
			},
		}}
		comment := database.Comment{
			Body: "example comment",
		}

		err := linearTask.AddComment(db, userID, "sample_account@email.com", comment, &database.Task{
			IDExternal: "24242424",
		})
		assert.EqualErrorf(t, err, err.Error(), "failed to create linear comment")
	})
	t.Run("AddCommentInvalidResponse", func(t *testing.T) {
		taskUpdateServer := testutils.GetMockAPIServer(t, 200, `to the moon`)
		defer taskUpdateServer.Close()
		linearTask := LinearTaskSource{Linear: LinearService{
			Config: LinearConfig{
				ConfigValues: LinearConfigValues{
					TaskUpdateURL: &taskUpdateServer.URL,
				},
			},
		}}
		comment := database.Comment{
			Body: "example comment",
		}

		err := linearTask.AddComment(db, userID, "sample_account@email.com", comment, &database.Task{
			IDExternal: "24242424",
		})
		assert.EqualErrorf(t, err, err.Error(), "failed to create linear comment")
	})
	t.Run("AddCommentSuccess", func(t *testing.T) {
		taskUpdateServer := testutils.GetMockAPIServer(t, 200, `{"data": {"commentCreate": {"success": true}}}`)
		defer taskUpdateServer.Close()
		linearTask := LinearTaskSource{Linear: LinearService{
			Config: LinearConfig{
				ConfigValues: LinearConfigValues{
					TaskUpdateURL: &taskUpdateServer.URL,
				},
			},
		}}
		comment := database.Comment{
			Body:       "example comment",
			ExternalID: "externalID",
		}

		err := linearTask.AddComment(db, userID, "sample_account@email.com", comment, &database.Task{
			IDExternal: "24242424",
		})
		assert.NoError(t, err)
	})
}

func assertTasksEqual(t *testing.T, a *database.Task, b *database.Task) {
	assert.Equal(t, a.Deeplink, b.Deeplink)
	assert.Equal(t, a.IDExternal, b.IDExternal)
	assert.Equal(t, a.IDOrdering, b.IDOrdering)
	assert.Equal(t, a.IDTaskSection, b.IDTaskSection)
	assert.Equal(t, a.SourceID, b.SourceID)
	assert.Equal(t, a.TimeAllocation, b.TimeAllocation)
	assert.Equal(t, a.Status, b.Status)
	assert.True(t, (a.Title == nil) == (b.Title == nil))
	if (a.Title != nil) && (b.Title != nil) {
		assert.Equal(t, *a.Title, *b.Title)
	}
	assert.True(t, (a.Body == nil) == (b.Body == nil))
	if (a.Body != nil) && (b.Body != nil) {
		assert.Equal(t, *a.Body, *b.Body)
	}
	assert.True(t, (a.PriorityNormalized == nil) == (b.PriorityNormalized == nil))
	if (a.PriorityNormalized != nil) && (b.PriorityNormalized != nil) {
		assert.Equal(t, *a.PriorityNormalized, *b.PriorityNormalized)
	}
	assert.True(t, (a.ExternalPriority == nil) == (b.ExternalPriority == nil))
	if (a.ExternalPriority != nil) && (b.ExternalPriority != nil) {
		assert.Equal(t, *&a.ExternalPriority.ExternalID, *&b.ExternalPriority.ExternalID)
	}
	assert.True(t, (a.Status == nil) == (b.Status == nil))
	if (a.Status != nil) && (b.Status != nil) {
		assert.Equal(t, a.Status.ExternalID, b.Status.ExternalID)
		assert.Equal(t, a.Status.State, b.Status.State)
		assert.Equal(t, a.Status.Type, b.Status.Type)
		assert.Equal(t, a.Status.IsCompletedStatus, b.Status.IsCompletedStatus)
		assert.Equal(t, a.Status.Position, b.Status.Position)
		assert.Equal(t, a.Status.Color, b.Status.Color)
		assert.Equal(t, a.Status.IsValidTransition, b.Status.IsValidTransition)
	}
	assert.True(t, (a.DueDate == nil) == (b.DueDate == nil))
	if (a.DueDate != nil) && (b.DueDate != nil) {
		assert.Equal(t, *a.DueDate, *b.DueDate)
	}
	assert.True(t, (a.Comments == nil) == (b.Comments == nil))
	if (a.Comments != nil) && (b.Comments != nil) {
		expectedComments := *a.Comments
		actualComments := *b.Comments
		assert.Equal(t, len(expectedComments), len(actualComments))
		if len(*a.Comments) == len(*b.Comments) {
			assert.Equal(t, expectedComments, actualComments)
		}
	}
	assertLinearCyclesEqual(t, a.LinearCycle, b.LinearCycle)
}

func assertLinearCyclesEqual(t *testing.T, a database.LinearCycle, b database.LinearCycle) {
	assert.Equal(t, a.ID, b.ID)
	assert.Equal(t, a.Name, b.Name)
	assert.Equal(t, a.Number, b.Number)
	assert.Equal(t, a.StartsAt, b.StartsAt)
	assert.Equal(t, a.EndsAt, b.EndsAt)
	assert.Equal(t, a.IsCurrentCycle, b.IsCurrentCycle)
	assert.Equal(t, a.IsPreviousCycle, b.IsPreviousCycle)
	assert.Equal(t, a.IsNextCycle, b.IsNextCycle)
}
