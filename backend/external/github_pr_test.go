package external

import "testing"

func TestLoadGithubPullRequests(t *testing.T) {
	t.Run("MissingToken", func(t *testing.T) {})
	t.Run("BadIssuesResponse", func(t *testing.T) {})
	t.Run("Success", func(t *testing.T) {})
	t.Run("SuccessExistingPullRequest", func(t *testing.T) {})
}
