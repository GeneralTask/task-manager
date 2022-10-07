package external

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"golang.org/x/oauth2"
)

func TestGetGoogleConfig(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		googleConfig := getGoogleLoginConfig()
		assert.Equal(
			t,
			"https://accounts.google.com/o/oauth2/auth?access_type=offline&client_id=786163085684-uvopl20u17kp4p2vd951odnm6f89f2f6.apps.googleusercontent.com&prompt=consent&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Flogin%2Fcallback%2F&response_type=code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar.events&state=state-token",
			googleConfig.AuthCodeURL("state-token", oauth2.AccessTypeOffline, oauth2.ApprovalForce),
		)
		includeGrantedScopes := oauth2.SetAuthURLParam("include_granted_scopes", "false")
		assert.Equal(
			t,
			"https://accounts.google.com/o/oauth2/auth?access_type=offline&client_id=786163085684-uvopl20u17kp4p2vd951odnm6f89f2f6.apps.googleusercontent.com&include_granted_scopes=false&prompt=consent&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Flogin%2Fcallback%2F&response_type=code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar.events&state=state-token",
			googleConfig.AuthCodeURL("state-token", oauth2.AccessTypeOffline, includeGrantedScopes, oauth2.ApprovalForce),
		)
	})
}
