package testutils

const (
	ClientResponsePayload       string = `{"id": 1, "plan": {}}`
	UserResponsePayload         string = `{"id": 1, "login": "chad1616"}`
	UserRepositoriesPayload     string = `[{"id": 1234, "name": "MyFirstRepo", "owner": {"login": "gigaChad123"}}]`
	UserPullRequestsPayload     string = `[{"id": 1, "number": 420, "title": "Fix big oopsie", "created_at": "2011-01-26T19:01:12Z", "html_url": "github.com", "user": {"login": "chad1616", "id": 1}, "requested_reviewers": [], "head": {"sha": "abc123", "ref": "abc123"}}]`
	PullRequestReviewersPayload string = `{"users": []}`
	CheckRunsForRefPayload      string = `{"total_count": 0, "check_runs": []}`
)
