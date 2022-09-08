package testutils

const (
	ClientResponsePayload              string = `{"id": 1, "plan": {}}`
	CompareResponsePayload             string = `{"files": [{"additions": 69, "deletions": 420}, {"additions": 24, "deletions": 42}]}`
	UserResponsePayload                string = `{"id": 1, "login": "chad1616"}`
	UserRepositoriesPayload            string = `[{"id": 1234, "name": "ExampleRepository", "full_name": "dankmemes/ExampleRepository", "owner": {"login": "gigaChad123"}}]`
	UserPullRequestsPayload            string = `[{"id": 1, "number": 420, "title": "Fix big oopsie", "body": "the oopsie must be fixed", "created_at": "2011-01-26T19:01:12Z", "updated_at": "2011-01-26T19:01:12Z", "html_url": "github.com", "user": {"login": "chad1616", "id": 1}, "requested_reviewers": [], "head": {"sha": "abc123", "ref": "ExampleBranch"}}]`
	UserNotRelevantPullRequestsPayload string = `[{"id": 2, "number": 42069, "title": "Fix big oopsie 2", "created_at": "2011-01-26T19:01:12Z", "updated_at": "2011-01-26T19:01:12Z", "html_url": "github.com", "user": {"login": "gigachad", "id": 2}, "requested_reviewers": [], "head": {"sha": "abc1234", "ref": "ExampleBranch2"}}]`
	PullRequestReviewersPayload        string = `{"users": [{"login": "goodTeamMember"}]}`
	PullRequestTeamReviewersPayload    string = `{"teams": [{"name": "goodTeam"}]}`
	EmptyPullRequestReviewersPayload   string = `{"users": []}`
	EmptyCheckRunsForRefPayload        string = `{"total_count": 0, "check_runs": []}`
	CheckRunsForRefPayload             string = `{"total_count": 1, "check_runs": [{"ID": 96024}]}`
	CheckRunsForRefFailPayload         string = `{"total_count": 1, "check_runs": [{"ID": 96024, "status": "completed", "conclusion": "failure"}]}`
	PullRequestCommentsPayload         string = `[{"id": 1, "body": "This is a comment", "user": {"login": "chad1616", "id": 1}, "created_at": "2011-01-26T19:01:12Z", "updated_at": "2011-01-26T19:01:12Z", "path": "tothemoon.txt", "start_line": 69, "line": 420}]`
	IssueCommentPayload                string = `[{"id": 1, "body": "This is a issue comment", "user": {"login": "gigachad2022", "id": 1}, "created_at": "2011-01-26T19:01:12Z", "updated_at": "2011-01-26T19:01:12Z"}]`
)
