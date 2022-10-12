package external

import (
	"fmt"
)

const (
	TASK_SERVICE_ID_GT        = "gt"
	TASK_SERVICE_ID_GITHUB    = "github"
	TASK_SERVICE_ID_GOOGLE    = "google"
	TASK_SERVICE_ID_LINEAR    = "linear"
	TASK_SERVICE_ID_SLACK     = "slack"
	TASK_SERVICE_ID_SLACK_APP = "slack_app"

	TASK_SOURCE_ID_GCAL        = "gcal"
	TASK_SOURCE_ID_GITHUB_PR   = "github_pr"
	TASK_SOURCE_ID_GT_TASK     = "gt_task"
	TASK_SOURCE_ID_LINEAR      = "linear_task"
	TASK_SOURCE_ID_SLACK_SAVED = "slack"
)

type Config struct {
	Github                GithubConfig
	GoogleLoginConfig     OauthConfigWrapper
	GoogleAuthorizeConfig OauthConfigWrapper
	Slack                 SlackConfig
	SlackApp              SlackConfig
	Linear                LinearConfig
	SlackOverrideURL      string
	GoogleOverrideURLs    GoogleURLOverrides
}

func GetConfig() Config {
	fetchToken := true
	return Config{
		GoogleLoginConfig:     getGoogleLoginConfig(),
		GoogleAuthorizeConfig: getGoogleLinkConfig(),
		Github:                GithubConfig{OauthConfig: getGithubConfig(), ConfigValues: GithubConfigValues{FetchExternalAPIToken: &fetchToken}},
		Slack:                 getSlackConfig(),
		SlackApp:              GetSlackAppConfig(),
		Linear:                LinearConfig{OauthConfig: getLinearOauthConfig()},
	}
}

type TaskServiceResult struct {
	Service TaskService
	Details TaskServiceDetails
	Sources []TaskSourceResult
}

type TaskSourceResult struct {
	Source  TaskSource
	Details TaskSourceDetails
}

func (config Config) GetTaskServiceResult(serviceID string) (*TaskServiceResult, error) {
	nameToService := config.GetNameToService()
	result, ok := nameToService[serviceID]
	if !ok {
		return nil, fmt.Errorf("task service %s not found", serviceID)
	}
	return &result, nil
}

func (config Config) GetSourceResult(sourceID string) (*TaskSourceResult, error) {
	nameToSource := config.getNameToSource()
	result, ok := nameToSource[sourceID]
	if !ok {
		return nil, fmt.Errorf("task source %s not found", sourceID)
	}
	return &result, nil
}

func (config Config) getNameToSource() map[string]TaskSourceResult {
	googleService := GoogleService{
		LoginConfig:  config.GoogleLoginConfig,
		LinkConfig:   config.GoogleAuthorizeConfig,
		OverrideURLs: config.GoogleOverrideURLs,
	}
	linearService := LinearService{Config: config.Linear}
	githubService := GithubService{Config: config.Github}
	slackService := SlackService{Config: config.Slack}

	return map[string]TaskSourceResult{
		TASK_SOURCE_ID_GCAL: {
			Details: TaskSourceGoogleCalendar,
			Source:  GoogleCalendarSource{Google: googleService},
		},
		TASK_SOURCE_ID_GT_TASK: {
			Details: TaskSourceGeneralTask,
			Source:  GeneralTaskTaskSource{},
		},
		TASK_SOURCE_ID_LINEAR: {
			Details: TaskSourceLinear,
			Source:  LinearTaskSource{Linear: linearService},
		},
		TASK_SOURCE_ID_GITHUB_PR: {
			Details: TaskSourceGithubPR,
			Source:  GithubPRSource{Github: githubService},
		},
		TASK_SOURCE_ID_SLACK_SAVED: {
			Details: TaskSourceSlackSaved,
			Source:  SlackSavedTaskSource{Slack: slackService},
		},
	}
}

func (config Config) GetNameToService() map[string]TaskServiceResult {
	linearService := LinearService{Config: config.Linear}
	googleService := GoogleService{
		LoginConfig:  config.GoogleLoginConfig,
		LinkConfig:   config.GoogleAuthorizeConfig,
		OverrideURLs: config.GoogleOverrideURLs,
	}
	githubService := GithubService{Config: config.Github}
	slackService := SlackService{Config: config.Slack}

	return map[string]TaskServiceResult{
		TASK_SERVICE_ID_GT: {
			Service: GeneralTaskService{},
			Details: TaskServiceGeneralTask,
			Sources: []TaskSourceResult{{Source: GeneralTaskTaskSource{}, Details: TaskSourceGeneralTask}},
		},
		TASK_SERVICE_ID_GOOGLE: {
			Service: googleService,
			Details: TaskServiceGoogle,
			Sources: []TaskSourceResult{
				{Source: GoogleCalendarSource{Google: googleService}, Details: TaskSourceGoogleCalendar},
			},
		},
		TASK_SERVICE_ID_SLACK: {
			Service: SlackService{Config: config.Slack},
			Details: TaskServiceSlack,
			Sources: []TaskSourceResult{{Source: SlackSavedTaskSource{Slack: slackService}, Details: TaskSourceSlackSaved}},
		},
		TASK_SERVICE_ID_SLACK_APP: {
			Service: SlackService{Config: config.SlackApp},
			Details: TaskServiceSlack,
			Sources: []TaskSourceResult{},
		},
		TASK_SERVICE_ID_GITHUB: {
			Service: githubService,
			Details: TaskServiceGithub,
			Sources: []TaskSourceResult{{Source: GithubPRSource{Github: githubService}, Details: TaskSourceGithubPR}},
		},
		TASK_SERVICE_ID_LINEAR: {
			Service: linearService,
			Details: TaskServiceLinear,
			Sources: []TaskSourceResult{{Source: LinearTaskSource{Linear: linearService}, Details: TaskSourceLinear}},
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
	LogoV2       string
	AuthType     AuthType
	IsLinkable   bool
	IsSignupable bool
}

var TaskServiceGeneralTask = TaskServiceDetails{
	ID:           TASK_SERVICE_ID_GT,
	Name:         "General Task",
	Logo:         "/images/generaltask.svg",
	LogoV2:       "generaltask",
	AuthType:     AuthTypeOauth2,
	IsLinkable:   false,
	IsSignupable: false,
}
var TaskServiceGithub = TaskServiceDetails{
	ID:           TASK_SERVICE_ID_GITHUB,
	Name:         "Github",
	Logo:         "/images/github.svg",
	LogoV2:       "github",
	AuthType:     AuthTypeOauth2,
	IsLinkable:   true,
	IsSignupable: false,
}
var TaskServiceGoogle = TaskServiceDetails{
	ID:           TASK_SERVICE_ID_GOOGLE,
	Name:         "Google Calendar",
	Logo:         "/images/gcal.png",
	LogoV2:       "gcal",
	AuthType:     AuthTypeOauth2,
	IsLinkable:   true,
	IsSignupable: true,
}
var TaskServiceSlack = TaskServiceDetails{
	ID:           TASK_SERVICE_ID_SLACK,
	Name:         "Slack",
	Logo:         "/images/slack.svg",
	LogoV2:       "slack",
	AuthType:     AuthTypeOauth2,
	IsLinkable:   true,
	IsSignupable: false,
}
var TaskServiceLinear = TaskServiceDetails{
	ID:           TASK_SERVICE_ID_LINEAR,
	Name:         "Linear",
	Logo:         "/images/linear.png",
	LogoV2:       "linear",
	AuthType:     AuthTypeOauth2,
	IsLinkable:   true,
	IsSignupable: false,
}

type TaskSourceDetails struct {
	ID                     string
	Name                   string
	Logo                   string
	LogoV2                 string
	IsCompletable          bool
	CanCreateTask          bool
	IsReplyable            bool
	CanCreateCalendarEvent bool
}

var TaskSourceGeneralTask = TaskSourceDetails{
	ID:                     TASK_SOURCE_ID_GT_TASK,
	Name:                   "General Task",
	Logo:                   "/images/generaltask.svg",
	LogoV2:                 "generaltask",
	IsCompletable:          true,
	CanCreateTask:          true,
	IsReplyable:            false,
	CanCreateCalendarEvent: false,
}
var TaskSourceGoogleCalendar = TaskSourceDetails{
	ID:                     TASK_SOURCE_ID_GCAL,
	Name:                   "Google Calendar",
	Logo:                   "/images/gcal.svg",
	LogoV2:                 "gcal",
	IsCompletable:          true,
	CanCreateTask:          false,
	IsReplyable:            false,
	CanCreateCalendarEvent: true,
}
var TaskSourceGithubPR = TaskSourceDetails{
	ID:                     TASK_SOURCE_ID_GITHUB_PR,
	Name:                   "Git PR",
	Logo:                   "/images/github.svg",
	LogoV2:                 "github",
	IsCompletable:          true,
	CanCreateTask:          false,
	IsReplyable:            false,
	CanCreateCalendarEvent: false,
}
var TaskSourceLinear = TaskSourceDetails{
	ID:                     TASK_SOURCE_ID_LINEAR,
	Name:                   "Linear",
	Logo:                   "/images/linear.png",
	LogoV2:                 "linear",
	IsCompletable:          true,
	CanCreateTask:          false,
	IsReplyable:            false,
	CanCreateCalendarEvent: false,
}
var TaskSourceSlackSaved = TaskSourceDetails{
	ID:                     TASK_SOURCE_ID_SLACK_SAVED,
	Name:                   "Slack",
	Logo:                   "/images/slack.png",
	LogoV2:                 "slack",
	IsCompletable:          true,
	CanCreateTask:          true,
	IsReplyable:            false,
	CanCreateCalendarEvent: false,
}
