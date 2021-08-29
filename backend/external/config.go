package external

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
	return nil, nil
}

func (config Config) GetTaskSource(name string) (*TaskSource, error) {
	nameToSource := {
		"google": &GoogleCalendarSource{},
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
