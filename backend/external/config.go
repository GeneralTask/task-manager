package external

type Config struct {
	Google             OauthConfigWrapper
	Slack              OauthConfigWrapper
	GoogleOverrideURLs GoogleURLOverrides
	Atlassian          AtlassianConfig
}

func GetConfig() Config {
	return Config{
		Google:    GetGoogleConfig(),
		Slack:     GetSlackConfig(),
		Atlassian: AtlassianConfig{OauthConfig: GetAtlassianOauthConfig()},
	}
}
