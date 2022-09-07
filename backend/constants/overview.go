package constants

type ViewType string

const (
	ViewLinearName             = "Linear"
	ViewSlackName              = "Slack"
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
