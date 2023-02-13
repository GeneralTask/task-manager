package constants

const (
	// Sidebar settings
	SettingFieldSidebarLinearPreference = "sidebar_linear_preference"
	SettingFieldSidebarJiraPreference   = "sidebar_jira_preference"
	SettingFieldSidebarGithubPreference = "sidebar_github_preference"
	SettingFieldSidebarSlackPreference  = "sidebar_slack_preference"
	// Github PR filtering
	SettingFieldGithubFilteringPreference = "github_filtering_preference"
	ChoiceKeyAllPRs                       = "all_prs"
	ChoiceKeyActionableOnly               = "actionable_only"
	// Github PR sorting
	SettingFieldGithubSortingPreference = "github_sorting_preference"
	ChoiceKeyRequiredAction             = "required_action"
	ChoiceKeyPRNumber                   = "pr_number"
	ChoiceKeyCreatedAt                  = "created_at"
	ChoiceKeyUpdatedAt                  = "updated_at"
	// Github PR sorting direction
	SettingFieldGithubSortingDirection = "github_sorting_direction"
	ChoiceKeyDescending                = "descending"
	ChoiceKeyAscending                 = "ascending"
	// Task sorting
	SettingFieldTaskSortingPreference = "task_sorting_preference"
	SettingFieldTaskSortingDirection  = "task_sorting_direction"
	ChoiceKeyManual                   = "manual"
	ChoiceKeyDueDate                  = "due_date"
	ChoiceKeyPriority                 = "priority"
	// Note sorting and filtering
	SettingFieldNoteSortingPreference   = "note_sorting_preference"
	SettingFieldNoteSortingDirection    = "note_sorting_direction"
	SettingFieldNoteFilteringPreference = "note_filtering_preference"
	ChoiceKeyNoDeleted                  = "no_deleted"
	ChoiceKeyShowDeleted                = "show_deleted"
	// Recurring task filtering
	SettingFieldRecurringTaskFilteringPreference = "recurring_task_filtering_preference"
	// Calendar choice
	SettingFieldCalendarForNewTasks   = "calendar_account_id_for_new_tasks"
	SettingFieldCalendarIDForNewTasks = "calendar_calendar_id_for_new_tasks"
	// Overview page settings
	SettingCollapseEmptyLists     = "collapse_empty_lists"
	SettingMoveEmptyListsToBottom = "move_empty_lists_to_bottom"
	// Lab settings
	LabSmartPrioritizeEnabled = "lab_smart_prioritize_enabled"
	// Misc settings
	HasDismissedMulticalPrompt = "has_dismissed_multical_prompt"
)

const (
	SettingFalse = "false"
)
