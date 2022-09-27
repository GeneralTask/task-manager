package external

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/logging"
	graphqlBasic "github.com/machinebox/graphql"
	"github.com/rs/zerolog/log"
	"github.com/shurcooL/graphql"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/oauth2"
)

const (
	LinearGraphqlEndpoint = "https://api.linear.app/graphql"
	LinearAuthUrl         = "https://linear.app/oauth/authorize"
	LinearTokenUrl        = "https://api.linear.app/oauth/token"
)

type LinearConfigValues struct {
	UserInfoURL    *string
	TaskFetchURL   *string
	TaskUpdateURL  *string
	StatusFetchURL *string
}

type LinearConfig struct {
	OauthConfig  OauthConfigWrapper
	ConfigValues LinearConfigValues
}

type LinearService struct {
	Config LinearConfig
}

func (linear LinearService) GetLinkURL(stateTokenID primitive.ObjectID, userID primitive.ObjectID) (*string, error) {
	authURL := linear.Config.OauthConfig.AuthCodeURL(stateTokenID.Hex(), oauth2.AccessTypeOffline, oauth2.ApprovalForce)
	return &authURL, nil
}

func (linear LinearService) GetSignupURL(stateTokenID primitive.ObjectID, forcePrompt bool) (*string, error) {
	return nil, errors.New("linear does not support signup")
}

func (linear LinearService) HandleLinkCallback(db *mongo.Database, params CallbackParams, userID primitive.ObjectID) error {
	parentCtx := context.Background()

	extCtx, cancel := context.WithTimeout(parentCtx, constants.ExternalTimeout)
	defer cancel()
	token, err := linear.Config.OauthConfig.Exchange(extCtx, *params.Oauth2Code)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("failed to fetch token from Linear")
		return errors.New("internal server error")
	}
	log.Debug().Interface("token", token).Send()

	tokenString, err := json.Marshal(&token)
	log.Info().Msgf("token string: %s", string(tokenString))
	if err != nil {
		logger.Error().Err(err).Msg("error parsing token")
		return errors.New("internal server error")
	}

	accountID, err := getLinearAccountID(token, linear.Config.ConfigValues.UserInfoURL)
	if err != nil {
		accountID = "" // TODO: maybe add a placeholder instead of empty string
	}

	externalAPITokenCollection := database.GetExternalTokenCollection(db)
	_, err = externalAPITokenCollection.UpdateOne(
		context.Background(),
		bson.M{"$and": []bson.M{{"user_id": userID}, {"service_id": TASK_SERVICE_ID_LINEAR}}},
		bson.M{"$set": &database.ExternalAPIToken{
			UserID:         userID,
			ServiceID:      TASK_SERVICE_ID_LINEAR,
			Token:          string(tokenString),
			AccountID:      accountID,
			DisplayID:      accountID,
			IsUnlinkable:   true,
			IsPrimaryLogin: false,
		}},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		logger.Error().Err(err).Msg("error saving token")
		return errors.New("internal server error")
	}

	return nil
}

func getLinearAccountID(token *oauth2.Token, overrideURL *string) (string, error) {
	client := getLinearClientFromToken(token, overrideURL)

	var query struct {
		Viewer struct {
			Id    graphql.String
			Name  graphql.String
			Email graphql.String
		}
	}
	err := client.Query(context.Background(), &query, nil)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Interface("query", query).Msg("could not execute query")
		return "", err
	}
	log.Debug().Interface("query", query).Send()
	return string(query.Viewer.Email), nil
}

func (linear LinearService) HandleSignupCallback(db *mongo.Database, params CallbackParams) (primitive.ObjectID, *bool, *string, error) {
	return primitive.NilObjectID, nil, nil, errors.New("linear does not support signup")
}

func getLinearClientFromToken(token *oauth2.Token, overrideURL *string) *graphql.Client {
	var client *graphql.Client
	if overrideURL != nil {
		client = graphql.NewClient(*overrideURL, nil)
	} else {
		httpClient := oauth2.NewClient(context.Background(), oauth2.StaticTokenSource(token))
		client = graphql.NewClient(LinearGraphqlEndpoint, httpClient)
	}
	return client
}

func getLinearClient(overrideURL *string, db *mongo.Database, userID primitive.ObjectID, accountID string) (*graphql.Client, error) {
	var client *graphql.Client
	var err error
	logger := logging.GetSentryLogger()
	if overrideURL != nil {
		client = graphql.NewClient(*overrideURL, nil)
	} else {
		httpClient := getLinearHttpClient(db, userID, accountID)
		if httpClient == nil {
			logger.Error().Msg("could not create linear client")
			return nil, errors.New("could not create linear client")
		}
		client = graphql.NewClient(LinearGraphqlEndpoint, httpClient)
	}
	if err != nil {
		return nil, err
	}

	return client, nil
}

func getBasicLinearClient(overrideURL *string, db *mongo.Database, userID primitive.ObjectID, accountID string) (*graphqlBasic.Client, error) {
	var client *graphqlBasic.Client
	var err error
	logger := logging.GetSentryLogger()
	if overrideURL != nil {
		client = graphqlBasic.NewClient(*overrideURL)
	} else {
		httpClient := getLinearHttpClient(db, userID, accountID)
		if httpClient == nil {
			logger.Error().Msg("could not create linear client")
			return nil, errors.New("could not create linear client")
		}
		client = graphqlBasic.NewClient(LinearGraphqlEndpoint, graphqlBasic.WithHTTPClient(httpClient))
	}
	if err != nil {
		return nil, err
	}

	return client, nil
}

func getLinearHttpClient(db *mongo.Database, userID primitive.ObjectID, accountID string) *http.Client {
	return getExternalOauth2Client(db, userID, accountID, TASK_SERVICE_ID_LINEAR, getLinearOauthConfig())
}

func getLinearOauthConfig() *OauthConfig {
	return &OauthConfig{Config: &oauth2.Config{
		ClientID:     config.GetConfigValue("LINEAR_OAUTH_CLIENT_ID"),
		ClientSecret: config.GetConfigValue("LINEAR_OAUTH_CLIENT_SECRET"),
		RedirectURL:  config.GetConfigValue("SERVER_URL") + "link/linear/callback/",
		Scopes:       []string{"read", "write"},
		Endpoint: oauth2.Endpoint{
			AuthURL:  LinearAuthUrl,
			TokenURL: LinearTokenUrl,
		},
	}}
}

type linearUserInfoQuery struct {
	Viewer struct {
		Id    graphql.String
		Name  graphql.String
		Email graphql.String
	}
}

type linearWorkflowStatesQuery struct {
	WorkflowStates struct {
		Nodes []struct {
			Id   graphql.ID
			Name graphql.String
			Type graphql.String
			Team struct {
				Name graphql.String
			}
		}
	}
}

type linearAssignedIssuesQuery struct {
	Issues struct {
		Nodes []struct {
			Id          graphql.ID
			Title       graphql.String
			Description graphql.String
			DueDate     graphql.String
			Url         graphql.String
			CreatedAt   graphql.String
			Priority    graphql.Float
			Assignee    struct {
				Email graphql.String
			}
			Team struct {
				Name               graphql.String
				MergeWorkflowState struct {
					Id   graphql.ID
					Name graphql.String
					Type graphql.String
				}
			}
			State struct {
				Id   graphql.ID
				Name graphql.String
				Type graphql.String
			}
			Comments struct {
				Nodes []struct {
					Body      graphql.String
					CreatedAt graphql.String
					User      struct {
						Id          graphql.ID
						Name        graphql.String
						DisplayName graphql.String
						Email       graphql.String
					}
				}
			}
		}
	} `graphql:"issues(filter: {state: {type: {nin: [\"completed\", \"canceled\"]}}, assignee: {email: {eq: $email}}})"`
}

// for some reason Linear outputs priority as a Float, and then expects an int on update
const linearUpdateIssueQueryStr = `
		mutation IssueUpdate (
			$title: String
			, $id: String!
			, $stateId: String
			, $dueDate: TimelessDate
			, $description: String
			, $priority: Int
		) {
		  issueUpdate(
			id: $id,
			input: {
			  title: $title
			  , stateId: $stateId
			  , dueDate: $dueDate
			  , description: $description
			  , priority: $priority
			}
		  ) {
			success
		  }
		}`

const linearUpdateIssueWithProsemirrorQueryStr = `
		mutation IssueUpdate (
			$title: String
			, $id: String!
			, $stateId: String
			, $dueDate: TimelessDate
			, $descriptionData: JSON
			, $priority: Int
		) {
		  issueUpdate(
			id: $id,
			input: {
			  title: $title
			  , stateId: $stateId
			  , dueDate: $dueDate
			  , descriptionData: $descriptionData
			  , priority: $priority
			}
		  ) {
			success
		  }
		}`

const linearDeleteIssueQueryStr = `
        mutation IssueArchive (
            $id: String!
            , $trash: Boolean!
        ) {
          issueArchive(
            id: $id,
            trash: $trash,
          ) {
            success
          }
        }`

const linearUndeleteIssueQueryStr = `
		mutation IssueUnarchive (
			$id: String!
		) {
		  issueUnarchive(
			id: $id,
		  ) {
			success
		  }
		}`

type linearUpdateIssueQuery struct {
	IssueUpdate struct {
		Success graphql.Boolean
	} `graphql:"issueUpdate(id: $id, input: {title: $title, stateId: $stateId, dueDate: $dueDate, description: $description, priority: $priority})"`
}

type linearDeleteIssueQuery struct {
	IssueArchive struct {
		Success graphql.Boolean
	} `graphql:"issueDelete(id: $id, trash: $trash)"`
}

type linearUndeleteIssueQuery struct {
	IssueUnarchive struct {
		Success graphql.Boolean
	} `graphql:"issueDelete(id: $id)"`
}

func handleDeleteLinearIssue(client *graphqlBasic.Client, issueID string, updateFields *database.Task, task *database.Task) (bool, error) {
	if updateFields.IsDeleted == nil {
		return false, errors.New("cannot handle delete issue query without IsDeleted param set")
	}
	if *updateFields.IsDeleted {
		deleteIssueQueryStr := linearDeleteIssueQueryStr
		request := graphqlBasic.NewRequest(deleteIssueQueryStr)
		request.Var("id", issueID)
		request.Var("trash", true)
		log.Debug().Msgf("sending request to Linear: %+v", request)
		var query linearDeleteIssueQuery
		logger := logging.GetSentryLogger()
		if err := client.Run(context.Background(), request, &query); err != nil {
			logger.Error().Err(err).Msg("failed to delete linear issue")
			return false, err
		}
		return bool(query.IssueArchive.Success), nil
	} else {
		deleteIssueQueryStr := linearUndeleteIssueQueryStr
		request := graphqlBasic.NewRequest(deleteIssueQueryStr)
		request.Var("id", issueID)
		log.Debug().Msgf("sending request to Linear: %+v", request)
		var query linearUndeleteIssueQuery
		logger := logging.GetSentryLogger()
		if err := client.Run(context.Background(), request, &query); err != nil {
			logger.Error().Err(err).Msg("failed to undelete linear issue")
			return false, err
		}
		return bool(query.IssueUnarchive.Success), nil
	}
}

const linearCommentCreateQueryStr = `
	mutation CommentCreate (
		$body: String
		, $issueId: String!
	) {
		commentCreate(
		input: {
			body: $body
			, issueId: $issueId
		}
		) {
		success
		}
	}`

type linearCommentCreateQuery struct {
	CommentCreate struct {
		Success graphql.Boolean
	} `graphql:"commentCreate(input: {body: $body, issueId: $issueId})"`
}

func handleMutateLinearIssue(client *graphqlBasic.Client, issueID string, updateFields *database.Task, task *database.Task) (bool, error) {
	updateIssueQueryStr := linearUpdateIssueQueryStr
	if updateFields.Body != nil && *updateFields.Body == "" {
		updateIssueQueryStr = linearUpdateIssueWithProsemirrorQueryStr
	}
	request := graphqlBasic.NewRequest(updateIssueQueryStr)

	request.Var("id", issueID)
	if updateFields.Title != nil {
		if *updateFields.Title == "" {
			return false, errors.New("cannot set linear issue title to empty string")
		}
		request.Var("title", *updateFields.Title)
	}
	if updateFields.Body != nil {
		if *updateFields.Body == "" {
			request.Var("descriptionData", `{"type":"doc","content":[{"type":"paragraph"}]}`)
		} else {
			request.Var("description", *updateFields.Body)
		}
	}
	if updateFields.IsCompleted != nil {
		if task.CompletedStatus != nil && *updateFields.IsCompleted {
			request.Var("stateId", task.CompletedStatus.ExternalID)
		} else {
			logger := logging.GetSentryLogger()
			if task.Status != nil && task.CompletedStatus != nil && task.Status.ExternalID != task.CompletedStatus.ExternalID {
				logger.Error().Msgf("cannot mark task as undone because its Status does not equal its CompletedStatus, task: %+v", task)
				return false, fmt.Errorf("cannot mark task as undone because its Status does not equal its CompletedStatus, task: %+v", task)
			} else if task.PreviousStatus != nil && task.PreviousStatus.ExternalID == "" {
				logger.Error().Msgf("cannot mark task as undone because it does not have a valid PreviousStatus, task: %+v", task)
				return false, fmt.Errorf("cannot mark task as undone because it does not have a valid PreviousStatus, task: %+v", task)
			}
			if task.PreviousStatus != nil {
				request.Var("stateId", task.PreviousStatus.ExternalID)
			}
		}
	}
	// not currently used, but should allow to work once the frontend logic changes
	if (updateFields.Status != nil && *updateFields.Status != database.ExternalTaskStatus{}) {
		request.Var("stateId", updateFields.Status.ExternalID)
	}
	if updateFields.DueDate != nil {
		request.Var("dueDate", updateFields.DueDate.Time().Format("2006-01-02"))
		if updateFields.DueDate.Time().Unix() == 0 {
			request.Var("dueDate", nil)
		}
	}
	if updateFields.PriorityNormalized != nil {
		request.Var("priority", int(*updateFields.PriorityNormalized))
	}

	log.Debug().Msgf("sending request to Linear: %+v", request)
	var query linearUpdateIssueQuery
	if err := client.Run(context.Background(), request, &query); err != nil {
		logger := logging.GetSentryLogger()
		logger.Error().Err(err).Msg("failed to update linear issue")
		return false, err
	}
	return bool(query.IssueUpdate.Success), nil
}

func updateLinearIssue(client *graphqlBasic.Client, issueID string, updateFields *database.Task, task *database.Task) (bool, error) {
	var success bool
	var err error
	if updateFields.IsDeleted != nil {
		success, err = handleDeleteLinearIssue(client, issueID, updateFields, task)
	} else {
		success, err = handleMutateLinearIssue(client, issueID, updateFields, task)
	}
	return success, err
}

func addLinearComment(client *graphqlBasic.Client, issueID string, comment database.Comment) error {
	request := graphqlBasic.NewRequest(linearCommentCreateQueryStr)
	request.Var("body", comment.Body)
	request.Var("issueId", issueID)

	log.Debug().Msgf("sending request to Linear: %+v", request)
	var query linearCommentCreateQuery
	logger := logging.GetSentryLogger()
	if err := client.Run(context.Background(), request, &query); err != nil {
		logger.Error().Err(err).Msg("failed to create linear comment")
		return err
	}
	if !query.CommentCreate.Success {
		err := errors.New("failed to create linear comment")
		logger.Error().Err(err).Send()
		return err
	}
	return nil
}

func getLinearUserInfoStruct(client *graphql.Client) (*linearUserInfoQuery, error) {
	var query linearUserInfoQuery
	err := client.Query(context.Background(), &query, nil)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("failed to fetch user info")
		return nil, err
	}
	return &query, nil
}

func getLinearAssignedIssues(client *graphql.Client, email graphql.String) (*linearAssignedIssuesQuery, error) {
	variables := map[string]interface{}{
		"email": email, // TODO: use ID instead of email to filter issues
	}
	var query linearAssignedIssuesQuery
	err := client.Query(context.Background(), &query, variables)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("failed to fetch issues assigned to user")
		return nil, err
	}
	return &query, nil
}

func getLinearWorkflowStates(client *graphql.Client) (*linearWorkflowStatesQuery, error) {
	var query linearWorkflowStatesQuery
	err := client.Query(context.Background(), &query, nil)
	logger := logging.GetSentryLogger()
	if err != nil {
		logger.Error().Err(err).Msg("failed to fetch issues assigned to user")
		return nil, err
	}
	return &query, nil
}

func processLinearStatuses(statusQuery *linearWorkflowStatesQuery) map[string][]*database.ExternalTaskStatus {
	teamToStatuses := make(map[string][]*database.ExternalTaskStatus)
	for _, node := range statusQuery.WorkflowStates.Nodes {
		teamToStatuses[string(node.Team.Name)] = append(teamToStatuses[string(node.Team.Name)], &database.ExternalTaskStatus{
			ExternalID:        (node.Id).(string),
			State:             string(node.Name),
			Type:              string(node.Type),
			IsCompletedStatus: string(node.Type) == "completed",
		})
	}
	return teamToStatuses
}
