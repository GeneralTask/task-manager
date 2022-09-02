package external

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetConfig(t *testing.T) {
	config := GetConfig()
	fetchToken := true

	assert.NotNil(t, config)
	assert.Equal(t, getGoogleLoginConfig(), config.GoogleLoginConfig)
	assert.Equal(t, getGoogleLinkConfig(), config.GoogleAuthorizeConfig)
	assert.Equal(t, GithubConfig{OauthConfig: getGithubConfig(), ConfigValues: GithubConfigValues{FetchExternalAPIToken: &fetchToken}}, config.Github)
	assert.Equal(t, getSlackConfig(), config.Slack)
	assert.Equal(t, GetSlackAppConfig(), config.SlackApp)
	assert.Equal(t, LinearConfig{OauthConfig: getLinearOauthConfig()}, config.Linear)
}

func TestGetTaskServiceResult(t *testing.T) {
	config := GetConfig()

	t.Run("InvalidName", func(t *testing.T) {
		_, err := config.GetTaskServiceResult("Invalid Service")
		assert.Error(t, err)
	})
	t.Run("SuccessGT", func(t *testing.T) {
		service, err := config.GetTaskServiceResult(TASK_SERVICE_ID_GT)
		assert.NoError(t, err)
		assert.Equal(t, GeneralTaskService{}, service.Service)
	})
}

func TestGetSourceResult(t *testing.T) {
	config := GetConfig()

	t.Run("InvalidName", func(t *testing.T) {
		_, err := config.GetSourceResult("Invalid Service")
		assert.Error(t, err)
	})
	t.Run("SuccessGT", func(t *testing.T) {
		source, err := config.GetSourceResult(TASK_SOURCE_ID_GT_TASK)
		assert.NoError(t, err)
		assert.Equal(t, GeneralTaskTaskSource{}, source.Source)
	})
}
