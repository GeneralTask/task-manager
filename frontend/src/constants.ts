import { TIconType } from './components/atoms/Icon'
import getEnvVars from './environment'
import { TIconColor } from './styles/colors'
import { icons } from './styles/images'

export const { REACT_APP_API_BASE_URL, COOKIE_DOMAIN } = getEnvVars()

// API Constants
export const TASK_SECTION_DEFAULT_ID = '-1'
export const AUTHORIZATION_COOKE = 'authToken'
export const MESSAGE_TYPE_DM = 'directmessage'

// Time constants (in milliseconds)
export const TASK_REFETCH_INTERVAL = 60 * 1000
export const PR_REFETCH_INTERVAL = 120 * 1000
export const EVENTS_REFETCH_INTERVAL = 60 * 1000
export const TIME_INDICATOR_INTERVAL = 6 * 1000
export const TASK_MARK_AS_DONE_TIMEOUT = 0.25 * 1000
export const DETAILS_SYNC_TIMEOUT = 1 * 1000
export const FIVE_SECOND_TIMEOUT = 5 * 1000
export const SINGLE_SECOND_INTERVAL = 1000
export const EVENT_UNDO_TIMEOUT = 5 * 1000
export const DRAG_TASK_TO_OPEN_CALENDAR_TIMEOUT = 0.5 * 1000
export const QUEUED_MUTATION_DEBOUNCE = 1 * 1000

// Backend Endpoints
export const TASKS_URL = REACT_APP_API_BASE_URL + '/tasks/'
export const TASKS_MODIFY_URL = REACT_APP_API_BASE_URL + '/tasks/modify/'
export const TASKS_CREATE_URL = REACT_APP_API_BASE_URL + '/tasks/create/'
export const ASANA_URL = REACT_APP_API_BASE_URL + '/link/asana/'
export const JIRA_URL = REACT_APP_API_BASE_URL + '/link/jira/'
export const LOGIN_URL = REACT_APP_API_BASE_URL + '/login/'
export const DEEPLINK_LOGIN_URL = LOGIN_URL + '?use_deeplink=true'
export const LOGOUT_URL = REACT_APP_API_BASE_URL + '/logout/'
export const SETTINGS_URL = REACT_APP_API_BASE_URL + '/settings/'
export const WAITLIST_URL = REACT_APP_API_BASE_URL + '/waitlist/'
export const LINKED_ACCOUNTS_URL = REACT_APP_API_BASE_URL + '/linked_accounts/'
export const SUPPORTED_TYPES_URL = REACT_APP_API_BASE_URL + '/linked_accounts/supported_types/'
export const LOG_EVENTS_URL = REACT_APP_API_BASE_URL + '/log_events/'
export const FEEDBACK_URL = REACT_APP_API_BASE_URL + '/feedback/'
export const EVENTS_URL = REACT_APP_API_BASE_URL + '/events/'

// Routes
export const TERMS_OF_SERVICE_ROUTE = 'terms-of-service'
export const PRIVACY_POLICY_ROUTE = 'privacy-policy'
export const FOCUS_MODE_ROUTE = 'focus-mode'

export const NO_EVENT_TITLE = '(no title)'
export const DEFAULT_SECTION_ID = '000000000000000000000001'
export const DONE_SECTION_ID = '000000000000000000000004'
export const TRASH_SECTION_ID = '000000000000000000000005'

export const GITHUB_SUPPORTED_TYPE_NAME = 'GitHub'
export const GITHUB_SUPPORTED_VIEW_NAME = 'GitHub'

export interface TTaskPriority {
    icon: TIconType
    label: string
    color: TIconColor
}
export const TASK_PRIORITIES: TTaskPriority[] = [
    { icon: icons.priority_none, label: 'No Priority', color: 'black' },
    { icon: icons.priority_urgent, label: 'Urgent', color: 'red' },
    { icon: icons.priority_high, label: 'High Priority', color: 'yellow' },
    { icon: icons.priority_medium, label: 'Medium Priority', color: 'blue' },
    { icon: icons.priority_low, label: 'Low Priority', color: 'green' },
]

export const GOOGLE_CALENDAR_SUPPORTED_TYPE_NAME = 'Google Calendar'
export const GENERAL_TASK_SOURCE_NAME = 'General Task'
