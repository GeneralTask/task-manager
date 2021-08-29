package external

import (
	"errors"

	"github.com/GeneralTask/task-manager/backend/database"
)

type Config struct {
	Google             OauthConfigWrapper
	Slack              OauthConfigWrapper
	GoogleOverrideURLs GoogleURLOverrides
	Atlassian          AtlassianConfig
}

func GetConfig() Config {
	return Config{
		Google:    getGoogleConfig(),
		Slack:     getSlackConfig(),
		Atlassian: AtlassianConfig{OauthConfig: getAtlassianOauthConfig()},
	}
}

type TaskServiceResult struct {
	Service TaskService
	Sources []TaskSource
}

func (config Config) GetTaskService(name string) (*TaskServiceResult, error) {
	nameToSource := config.getNameToSource()
	nameToService := map[string]TaskServiceResult{}
	for _, taskSource := range nameToSource {

	}
	return nil, nil
}

func (config Config) GetTaskSource(name string) (*TaskSource, error) {
	nameToSource := config.getNameToSource()
	result, ok := nameToSource[name]
	if !ok {
		return nil, errors.New("task source not found")
	}
	return &result, nil
}

func (config Config) getNameToSource() map[string]TaskSource {
	atlassianService := AtlassianService{Config: config.Atlassian}
	googleService := GoogleService{
		Config:       config.Google,
		OverrideURLs: config.GoogleOverrideURLs,
	}
	return map[string]TaskSource{
		database.TaskSourceGmail.Name:          GmailSource{Google: googleService},
		database.TaskSourceGoogleCalendar.Name: GoogleCalendarSource{Google: googleService},
		database.TaskSourceJIRA.Name:           JIRASource{Atlassian: atlassianService},
	}
}

func (config Config) getNameToService() map[string]TaskServiceResult {
	// atlassianService := AtlassianService{Config: config.Atlassian}
	googleService := GoogleService{
		Config:       config.Google,
		OverrideURLs: config.GoogleOverrideURLs,
	}
	return map[string]TaskServiceResult{
		"google": TaskServiceResult{
			Service: googleService,
			Sources: []TaskSource{
				GmailSource{Google: googleService},
				GoogleCalendarSource{Google: googleService},
			},
		},
		// database.TaskSourceGoogleCalendar.Name: GoogleCalendarSource{Google: googleService},
		// database.TaskSourceJIRA.Name:           JIRASource{Atlassian: atlassianService},
	}
}

/*

Name to task source:
- google
- gmail
- gcal
- jira
- slack

ideally:
Name to task service (used for external API keys)
- google
- atlassian
- slack

Name to task source (used for task db items and fetching)
- gmail
- gcal
- jira
- slack

task service to task source (for fetching all tasks given external API keys)
google -> [gmail, gcal]
atlassian -> [jira]
slack -> [slack]

*/
