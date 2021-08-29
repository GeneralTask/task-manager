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

type TaskSource2 struct {
	Name          string
	Logo          string
	IsCompletable bool
	IsReplyable   bool
}

var TaskSourceGoogleCalendar = TaskSource2{
	"Google Calendar",
	"/images/gcal.svg",
	false,
	false,
}

var TaskSourceGmail = TaskSource2{
	"Gmail",
	"/images/gmail.svg",
	true,
	true,
}
var TaskSourceJIRA = TaskSource2{
	"Jira",
	"/images/jira.svg",
	true,
	false,
}

var TaskSourceSlack = TaskSource2{
	"Slack",
	"/images/slack.svg",
	true,
	true,
}

var TaskSourceNameToSource = map[string]TaskSource2{
	TaskSourceGoogleCalendar.Name: TaskSourceGoogleCalendar,
	TaskSourceGmail.Name:          TaskSourceGmail,
	TaskSourceJIRA.Name:           TaskSourceJIRA,
	TaskSourceSlack.Name:          TaskSourceSlack,
	// Add "google" so this map can be used for external API token source also
	"google": TaskSourceGmail,
}
