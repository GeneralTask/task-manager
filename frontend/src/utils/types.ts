import { TStatusColors } from '../styles/colors'
import { TIconImage, TLogoImage } from '../styles/images'
import { RecurrenceRate } from './enums'

export type EmptyString = ''

export type TTaskSourceName = 'General Task' | 'Google Calendar' | 'Git PR' | 'Jira' | 'Linear' | 'Slack'

export interface TTaskSource {
    name: TTaskSourceName
    logo: string
    logo_v2: TLogoImage
    is_completable: boolean
    is_replyable: boolean
}

export interface TConferenceCall {
    platform: string
    logo: TLogoImage | EmptyString
    url: string
}

export interface TSourcesResult {
    name: string
    authorization_url: string
}

export interface TExternalPriority {
    external_id: string
    name: string
    priority_normalized: number
    color: string
    icon_url: string
}

export interface TTask {
    id: string
    optimisticId?: string
    id_ordering: number
    title: string
    deeplink: string
    body: string
    sent_at: string
    priority_normalized: number
    time_allocated: number
    due_date: string
    external_status?: TExternalStatus
    all_statuses?: TExternalStatus[]
    source: TTaskSource
    sender: string
    is_done: boolean
    is_deleted: boolean
    is_meeting_preparation_task: boolean
    comments?: TComment[]
    isSubtask?: boolean
    slack_message_params?: TSlackMessageParams
    meeting_preparation_params?: TMeetingPreparationParams
    nux_number_id: number
    sub_tasks?: TTask[]
    created_at: string
    updated_at: string
    parent_task_id?: string
    recurring_task_template_id?: string
    priority?: TExternalPriority
    all_priorities?: TExternalPriority[]
}
export interface TTaskV4 {
    id: string
    optimisticId?: string // Used only internally, not sent in response
    id_ordering: number
    title: string
    deeplink: string
    body: string
    priority_normalized: number
    due_date: string
    source: TTaskSource
    sender: string
    is_done: boolean
    is_deleted: boolean
    created_at: string
    updated_at: string
    id_folder: string
    id_nux_number?: number
    id_parent?: string
    subtask_ids?: string[]
    meeting_preparation_params?: TMeetingPreparationParams
    slack_message_params?: TSlackMessageParams
    comments?: TComment[]
    external_status?: TExternalStatus
    recurring_task_template_id?: string

    all_statuses?: TExternalStatus[] // Deprecated but still in response (will be moved to userInfo)
}

export interface TMeetingPreparationParams {
    datetime_start: string
    datetime_end: string
}

export interface TSlackMessageParams {
    channel: {
        id: string
        name: string // ex. general, shitposting, directmessage
    }
    user: {
        id: string
        name: string // the user who initiated the shortcut. *NOT* the user who sent the message
    }
    team: {
        id: string
        domain: string // ex. generaltask
    }
    message: {
        text: string
        ts: number // time sent
        type: string // message type
        user: string // user ID of who sent the message. *NOT* the user name
    }
}

export interface TComment {
    body: string
    created_at: string
    user: TCommentUser
}

export interface TCommentUser {
    DisplayName: string
    Email: string
    ExternalID: string
    Name: string
}

export interface TExternalStatus {
    external_id: string // the id of the status on linear
    state: string // the custom name of the status (e.g. Todo) - note: these are self-defined by the users of linear and can be different even across teams
    type: 'backlog' | 'unstarted' | 'started' | 'completed' | 'canceled' // the type of status native to the task application
}

export interface TEvent {
    id: string
    optimisticId?: string
    title: string
    body: string
    account_id: string
    calendar_id: string
    color_id: string
    logo: TLogoImage
    deeplink: string
    datetime_start: string
    datetime_end: string
    can_modify: boolean
    conference_call: TConferenceCall
    linked_task_id: string
    linked_view_id: string
    linked_pr_id: string
}

export interface TMeetingBanner {
    title: string
    subtitle: string
    events: TMeetingEvent[]
    actions: TMeetingAction[]
}

export interface TMeetingEvent {
    title: string
    conference_call: TConferenceCall
}

export interface TMeetingAction {
    logo: string
    title: string
    link: string
}

// Pull Request Types
export interface TPullRequest {
    id: string
    deeplink: string
    title: string
    body: string
    repository_name: string
    number: number
    author: string
    branch: string
    base_branch: string
    status: {
        text: string
        color: TStatusColors
    }
    comments: TPullRequestComment[]
    num_comments: number
    num_commits: number
    additions: number
    deletions: number
    created_at: string
    last_updated_at: string
}

export interface TPullRequestComment {
    type: 'inline' | 'toplevel'
    body: string
    author: string
    filepath: string
    line_number_start: number
    line_number_end: number
    last_updated_at: string
}

export interface TRepository {
    id: string
    name: string
    pull_requests: TPullRequest[]
}

export interface TTaskSection {
    id: string
    optimisticId?: string
    name: string
    tasks: TTask[]
    is_done: boolean
    is_trash: boolean
}

export interface TSettingChoice {
    choice_key: string
    choice_name: string
}

export interface TSetting {
    field_key: string
    field_value: string
    field_name: string
    choices: TSettingChoice[]
}

export interface TSupportedType {
    name: string
    logo: string
    logo_v2: TLogoImage
    authorization_url: string
}
export interface TLinkedAccount {
    id: string
    display_id: string
    name: string
    logo: string
    logo_v2: TLogoImage
    is_unlinkable: boolean
    has_bad_token: boolean
}

export interface TUserInfo {
    agreed_to_terms: boolean
    opted_into_marketing: boolean
    name: string
    is_employee: boolean
    email: string
    linear_name?: string
    linear_display_name?: string
}

// React-DND Item Types
export enum DropType {
    TASK = 'task',
    SUBTASK = 'subtask',
    NON_REORDERABLE_TASK = 'non-reorderable-task',
    DUE_TASK = 'due-task',
    WEEK_TASK_TO_CALENDAR_TASK = 'week-task-to-calendar-task',
    EVENT = 'event',
    EVENT_RESIZE_HANDLE = 'event-resize-handle',
    OVERVIEW_VIEW = 'overview-view',
    FOLDER = 'folder',
    OVERVIEW_VIEW_HEADER = 'overview-view-header',
    PULL_REQUEST = 'pull-request',
}

export interface DropItem {
    id: string
    sectionId?: string
    task?: TTask
    event?: TEvent
    folder?: TTaskSection
    view?: TOverviewView
    pullRequest?: TPullRequest
}

export interface TTaskCreateParams {
    account_id?: string
    title: string
    body?: string
    due_date?: string
    time_duration?: number
    id_task_section?: string
}

export type TOverviewItem = TTask & TPullRequest // TODO: change this to more general type

export type TOverviewViewType = 'github' | 'task_section' | 'linear' | 'slack' | 'meeting_preparation' | 'due_today'

export interface TOverviewView {
    id: string
    optimisticId?: string
    name: string
    type: TOverviewViewType
    task_section_id?: string
    is_reorderable: boolean
    logo: TLogoImage
    view_items: TOverviewItem[]
    total_view_items?: number // the total number of items in the view without filters applied
    sources: TSourcesResult[]
    is_linked: boolean
    has_tasks_completed_today: boolean
}

export interface TSupportedViewItem {
    view_id: string // id of view if is_linked is true
    optimisticId?: string
    name: string
    is_linked: boolean
    github_id: string
    task_section_id: string
    slack_id: string
    logo: TLogoImage
    is_added: boolean
}

export interface TSupportedView {
    optimisticId?: string
    type: TOverviewViewType
    name: string
    logo: TLogoImage
    is_nested: boolean
    is_linked: boolean
    views: TSupportedViewItem[]
    authorization_url: string
}

export type TShortcutCategory = 'Tasks' | 'Calendar' | 'General' | 'Navigation'

export interface TShortcut {
    label: string
    key: string
    keyLabel: string
    category: TShortcutCategory
    icon?: TIconImage
    hideFromCommandPalette?: boolean
    action: () => void
}

export interface TRecurringTaskTemplate {
    id: string
    optimisticId?: string
    title: string
    body?: string
    id_task_section: string
    priority_normalized?: number
    recurrence_rate: RecurrenceRate
    time_of_day_seconds_to_create_task: number
    day_to_create_task?: number
    month_to_create_task?: number
    last_backfill_datetime: string
    created_at: string
    updated_at: string
    is_deleted: boolean
    is_enabled: boolean
}

export type TLinkedAccountName = 'Atlassian' | 'GitHub' | 'Google Calendar' | 'Slack' | 'Linear'

export interface TNote {
    id: string
    title: string
    body: string
    author: string
    created_at: string
    updated_at: string
    is_deleted: boolean
    shared_until?: string
    optimisticId?: string
}

export interface TCalendar {
    calendar_id: string
    color_id: string
    title: string
    can_write: boolean
}

export interface TCalendarAccount {
    account_id: string
    calendars: TCalendar[]
    has_multical_scopes: boolean
    has_primary_calendar_scopes: boolean
}
