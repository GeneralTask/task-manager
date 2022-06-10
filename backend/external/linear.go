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
	UserInfoURL   *string
	TaskFetchURL  *string
	TaskUpdateURL *string
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

func (linear LinearService) HandleLinkCallback(params CallbackParams, userID primitive.ObjectID) error {
	parentCtx := context.Background()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return errors.New("internal server error")
	}
	defer dbCleanup()

	extCtx, cancel := context.WithTimeout(parentCtx, constants.ExternalTimeout)
	defer cancel()
	token, err := linear.Config.OauthConfig.Exchange(extCtx, *params.Oauth2Code)
	if err != nil {
		log.Error().Err(err).Msg("failed to fetch token from Linear")
		return errors.New("internal server error")
	}
	log.Debug().Interface("token", token).Send()

	tokenString, err := json.Marshal(&token)
	log.Info().Msgf("token string: %s", string(tokenString))
	if err != nil {
		log.Error().Err(err).Msg("error parsing token")
		return errors.New("internal server error")
	}

	accountID, err := getLinearAccountID(token, linear.Config.ConfigValues.UserInfoURL)
	if err != nil {
		accountID = "" // TODO: maybe add a placeholder instead of empty string
	}

	externalAPITokenCollection := database.GetExternalTokenCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	// TODO: add DisplayID, AccountID, etc.
	_, err = externalAPITokenCollection.UpdateOne(
		dbCtx,
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
		log.Error().Err(err).Msg("error saving token")
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
	if err != nil {
		log.Error().Err(err).Interface("query", query).Msg("could not execute query")
		return "", err
	}
	log.Debug().Interface("query", query).Send()
	return string(query.Viewer.Email), nil
}

func (linear LinearService) HandleSignupCallback(params CallbackParams) (primitive.ObjectID, *bool, *string, error) {
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
	if overrideURL != nil {
		client = graphql.NewClient(*overrideURL, nil)
	} else {
		httpClient := getLinearHttpClient(db, userID, accountID)
		if httpClient == nil {
			log.Error().Msg("could not create linear client")
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
	if overrideURL != nil {
		client = graphqlBasic.NewClient(*overrideURL, nil)
	} else {
		httpClient := getLinearHttpClient(db, userID, accountID)
		if httpClient == nil {
			log.Error().Msg("could not create linear client")
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

type linearAssignedIssuesQuery struct {
	Issues struct {
		Nodes []struct {
			Id          graphql.ID
			Title       graphql.String
			Description graphql.String
			DueDate     graphql.String
			Url         graphql.String
			CreatedAt   graphql.String
			Assignee    struct {
				Id          graphql.ID
				Name        graphql.String
				DisplayName graphql.String
				Email       graphql.String
			}
			Team struct {
				Name               graphql.String
				MergeWorkflowState struct {
					Id   graphql.ID
					Name graphql.String
				}
			}
			State struct {
				Id   graphql.ID
				Name graphql.String
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

const linearUpdateIssueQueryStr = `
		mutation IssueUpdate (
			$title: String
			, $id: String!
			, $stateId: String
			, $description: String
		) {
		  issueUpdate(
			id: $id,
			input: {
			  title: $title
			  stateId: $stateId,
			  description: $description
			}
		  ) {
			success
		  }
		}`

type linearUpdateIssueQuery struct {
	IssueUpdate struct {
		Success graphql.Boolean
	} `graphql:"issueUpdate(id: $id, input: {title: $title, stateId: $stateId, description: $description})"`
}

func updateLinearIssueMutation2(client *graphqlBasic.Client, issueID string, updateFields *database.TaskItemChangeableFields, task *database.Item) (*linearUpdateIssueQuery, error) {
	req := graphqlBasic.NewRequest(linearUpdateIssueQueryStr)
	req.Var("id", issueID)

	if updateFields.Title != nil {
		req.Var("title", *updateFields.Title) // will fail linear graphql validation on empty string
	}
	if updateFields.Body != nil {
		req.Var("description", *updateFields.Body) // empty string is ok but will be a NOOP
	}
	if updateFields.IsCompleted != nil {
		if *updateFields.IsCompleted {
			req.Var("$stateId", task.CompletedStatus.ExternalID)
		} else {
			log.Print(task.Status.ExternalID)
			log.Print(task.CompletedStatus.ExternalID)
			if task.Status.ExternalID != task.CompletedStatus.ExternalID {
				log.Error().Msgf("cannot mark task as undone because its Status does not equal its CompletedStatus, task: %+v", task)
				return nil, fmt.Errorf("cannot mark task as undone because its Status does not equal its CompletedStatus, task: %+v", task)
			} else if task.PreviousStatus.ExternalID == "" {
				log.Error().Msgf("cannot mark task as undone because it does not have a valid PreviousStatus, task: %+v", task)
				return nil, fmt.Errorf("cannot mark task as undone because it does not have a valid PreviousStatus, task: %+v", task)
			}
			req.Var("$stateId", task.PreviousStatus.ExternalID)
		}
	}

	var query linearUpdateIssueQuery
	if err := client.Run(context.Background(), req, &query); err != nil {
		log.Error().Err(err).Msg("failed to update linear issue")
		return nil, err
	}
	return &query, nil
}

func getLinearUserInfoStruct(client *graphql.Client) (*linearUserInfoQuery, error) {
	var query linearUserInfoQuery
	err := client.Query(context.Background(), &query, nil)
	if err != nil {
		log.Error().Err(err).Msg("failed to fetch user info")
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
	if err != nil {
		log.Error().Err(err).Msg("failed to fetch issues assigned to user")
		return nil, err
	}
	return &query, nil
}
