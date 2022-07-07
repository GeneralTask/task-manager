package testutils

const (
	ClientResponsePayload            string = `{"id": 1, "plan": {}}`
	UserResponsePayload              string = `{"id": 1, "login": "chad1616"}`
	UserRepositoriesPayload          string = `[{"id": 1234, "name": "ExampleRepository", "owner": {"login": "gigaChad123"}}]`
	UserPullRequestsPayload          string = `[{"id": 1, "number": 420, "title": "Fix big oopsie", "created_at": "2011-01-26T19:01:12Z", "html_url": "github.com", "user": {"login": "chad1616", "id": 1}, "requested_reviewers": [], "head": {"sha": "abc123", "ref": "ExampleBranch"}}]`
	PullRequestReviewersPayload      string = `{"users": [{"login": "goodTeamMember"}]}`
	EmptyPullRequestReviewersPayload string = `{"users": []}`
	EmptyCheckRunsForRefPayload      string = `{"total_count": 0, "check_runs": []}`
	CheckRunsForRefPayload           string = `{"total_count": 1, "check_runs": [{"ID": 96024}]}`
	PullRequestCommentsPayload       string = `[{"id": 1, "body": "This is a comment", "user": {"login": "chad1616", "id": 1}, "created_at": "2011-01-26T19:01:12Z", "updated_at": "2011-01-26T19:01:12Z"}]`
)
