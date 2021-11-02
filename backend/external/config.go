package external

import (
	"errors"

	"github.com/dghubble/oauth1"
)

const (
	TASK_SERVICE_ID_ATLASSIAN = "atlassian"
	TASK_SERVICE_ID_GT        = "gt"
	TASK_SERVICE_ID_GOOGLE    = "google"
	TASK_SERVICE_ID_SLACK     = "slack"
	TASK_SERVICE_ID_TRELLO    = "trello"

	TASK_SOURCE_ID_GCAL    = "gcal"
	TASK_SOURCE_ID_GT_TASK = "gt_task"
	TASK_SOURCE_ID_GMAIL   = "gmail"
	TASK_SOURCE_ID_JIRA    = "jira"
)

type Config struct {
	GoogleLoginConfig     OauthConfigWrapper
	GoogleAuthorizeConfig OauthConfigWrapper
	Slack                 OauthConfigWrapper
	Trello                *oauth1.Config
	GoogleOverrideURLs    GoogleURLOverrides
	Atlassian             AtlassianConfig
}

func GetConfig() Config {
	return Config{
		GoogleLoginConfig:     getGoogleLoginConfig(),
		GoogleAuthorizeConfig: getGoogleLinkConfig(),
		Slack:                 getSlackConfig(),
		Trello:                getTrelloConfig(),
		Atlassian:             AtlassianConfig{OauthConfig: getAtlassianOauthConfig()},
	}
}

type TaskServiceResult struct {
	Service TaskService
	Details TaskServiceDetails
	Sources []TaskSource
}

type TaskSourceResult struct {
	Source  TaskSource
	Details TaskSourceDetails
}

func (config Config) GetTaskServiceResult(serviceID string) (*TaskServiceResult, error) {
	nameToService := config.GetNameToService()
	result, ok := nameToService[serviceID]
	if !ok {
		return nil, errors.New("task service not found")
	}
	return &result, nil
}

func (config Config) GetTaskSourceResult(serviceID string) (*TaskSourceResult, error) {
	nameToSource := config.getNameToSource()
	result, ok := nameToSource[serviceID]
	if !ok {
		return nil, errors.New("task source not found")
	}
	return &result, nil
}

func (config Config) getNameToSource() map[string]TaskSourceResult {
	atlassianService := AtlassianService{Config: config.Atlassian}
	googleService := GoogleService{
		LoginConfig:  config.GoogleLoginConfig,
		LinkConfig:   config.GoogleAuthorizeConfig,
		OverrideURLs: config.GoogleOverrideURLs,
	}
	return map[string]TaskSourceResult{
		TASK_SOURCE_ID_GCAL: {
			Details: TaskSourceGoogleCalendar,
			Source:  GoogleCalendarSource{Google: googleService},
		},
		TASK_SOURCE_ID_GT_TASK: {
			Details: TaskSourceGeneralTask,
			Source:  GeneralTaskTaskSource{},
		},
		TASK_SOURCE_ID_GMAIL: {
			Details: TaskSourceGmail,
			Source:  GmailSource{Google: googleService},
		},
		TASK_SOURCE_ID_JIRA: {
			Details: TaskSourceJIRA,
			Source:  JIRASource{Atlassian: atlassianService},
		},
	}
}

func (config Config) GetNameToService() map[string]TaskServiceResult {
	atlassianService := AtlassianService{Config: config.Atlassian}
	googleService := GoogleService{
		LoginConfig:  config.GoogleLoginConfig,
		LinkConfig:   config.GoogleAuthorizeConfig,
		OverrideURLs: config.GoogleOverrideURLs,
	}
	return map[string]TaskServiceResult{
		TASK_SERVICE_ID_ATLASSIAN: {
			Service: atlassianService,
			Details: TaskServiceAtlassian,
			Sources: []TaskSource{JIRASource{Atlassian: atlassianService}},
		},
		TASK_SERVICE_ID_GT: {
			Service: GeneralTaskService{},
			Details: TaskServiceGeneralTask,
			Sources: []TaskSource{GeneralTaskTaskSource{}},
		},
		TASK_SERVICE_ID_GOOGLE: {
			Service: googleService,
			Details: TaskServiceGoogle,
			Sources: []TaskSource{
				GmailSource{Google: googleService},
				GoogleCalendarSource{Google: googleService},
			},
		},
		TASK_SERVICE_ID_SLACK: {
			Service: SlackService{Config: config.Slack},
			Details: TaskServiceSlack,
			Sources: []TaskSource{},
		},
		TASK_SERVICE_ID_TRELLO: {
			Service: TrelloService{Config: config.Trello},
			Details: TaskServiceTrello,
			Sources: []TaskSource{},
		},
	}
}

type AuthType string

var AuthTypeOauth2 AuthType = "oauth2"
var AuthTypeOauth1 AuthType = "oauth1"

type TaskServiceDetails struct {
	ID           string
	Name         string
	Logo         string
	AuthType     AuthType
	IsLinkable   bool
	IsSignupable bool
}

var TaskServiceAtlassian = TaskServiceDetails{
	TASK_SERVICE_ID_ATLASSIAN,
	"Atlassian",
	"/images/jira.svg",
	AuthTypeOauth2,
	true,
	false,
}
var TaskServiceGeneralTask = TaskServiceDetails{
	TASK_SERVICE_ID_ATLASSIAN,
	"General Task",
	"/images/general_task.svg",
	AuthTypeOauth2,
	false,
	false,
}
var TaskServiceGoogle = TaskServiceDetails{
	TASK_SERVICE_ID_GOOGLE,
	"Google",
	"/images/gmail.svg",
	AuthTypeOauth2,
	true,
	true,
}
var TaskServiceSlack = TaskServiceDetails{
	TASK_SERVICE_ID_SLACK,
	"Slack",
	"/images/slack.svg",
	AuthTypeOauth2,
	false,
	false,
}
var TaskServiceTrello = TaskServiceDetails{
	TASK_SERVICE_ID_TRELLO,
	"Trello",
	"/images/trello.svg",
	AuthTypeOauth1,
	false,
	false,
}

type TaskSourceDetails struct {
	ID            string
	Name          string
	Logo          string
	IsCompletable bool
	IsReplyable   bool
}

var TaskSourceGeneralTask = TaskSourceDetails{
	TASK_SOURCE_ID_GT_TASK,
	"General Task",
	"/images/general_task.svg",
	true,
	false,
}
var TaskSourceGoogleCalendar = TaskSourceDetails{
	TASK_SOURCE_ID_GCAL,
	"Google Calendar",
	"/images/gcal.svg",
	false,
	false,
}

var TaskSourceGmail = TaskSourceDetails{
	TASK_SOURCE_ID_GMAIL,
	"Gmail",
	"/images/gmail.svg",
	true,
	true,
}
var TaskSourceJIRA = TaskSourceDetails{
	TASK_SOURCE_ID_JIRA,
	"Jira",
	"/images/jira.svg",
	true,
	false,
}
