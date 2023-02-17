package constants

type ViewType string

const (
	ViewLinearSourceName = "Linear"
	ViewSlackSourceName  = "Slack"
)

const (
	ViewLinearName             = "Linear Issues"
	ViewSlackName              = "Slack Messages"
	ViewGithubName             = "Github"
	ViewMeetingPreparationName = "Meeting Preparation"
	ViewDueTodayName           = "Due Today"
)

const (
	ViewTaskSection        ViewType = "task_section"
	ViewLinear             ViewType = "linear"
	ViewSlack              ViewType = "slack"
	ViewGithub             ViewType = "github"
	ViewMeetingPreparation ViewType = "meeting_preparation"
	ViewDueToday           ViewType = "due_today"
)

const (
	MAX_OVERVIEW_SUGGESTION int = 5
)

const ShowMovedOrDeleted = "show_moved_or_deleted"
