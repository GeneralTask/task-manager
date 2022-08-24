import getEnvVars from './environment'

export const { REACT_APP_API_BASE_URL, COOKIE_DOMAIN } = getEnvVars()

// API Constants
export const TASK_SECTION_DEFAULT_ID = '-1'
export const AUTHORIZATION_COOKE = 'authToken'
export const MESSAGE_TYPE_DM = 'directmessage'

// Time constants (in seconds)
export const TASK_REFETCH_INTERVAL = 30
export const PR_REFETCH_INTERVAL = 60
export const EVENTS_REFETCH_INTERVAL = 60
export const TIME_INDICATOR_INTERVAL = 6
export const TASK_MARK_AS_DONE_TIMEOUT = 0.25
export const TASK_MARK_AS_READ_TIMEOUT = 0.5
export const DETAILS_SYNC_TIMEOUT = 1
export const SINGLE_SECOND_INTERVAL = 1
export const CALENDAR_DEFAULT_EVENT_DURATION = 30
export const EVENT_UNDO_TIMEOUT = 5

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

export const NO_EVENT_TITLE = '(no title)'
export const DONE_SECTION_ID = '000000000000000000000004'
export const DEFAULT_SECTION_ID = '000000000000000000000001'

const CMD_CTRL_KEY = navigator.userAgent.includes('Mac') ? 'Meta' : 'Ctrl'
export const KEYBOARD_SHORTCUTS = Object.freeze({
    arrowUp: 'ArrowUp',
    arrowDown: 'ArrowDown',
    calendar: 'C',
    close: 'Escape',
    createTask: 'T',
    down: 'K',
    markComplete: 'D',
    next: 'ArrowDown',
    nextDate: 'N',
    previous: 'ArrowUp',
    previousDate: 'P',
    refresh: CMD_CTRL_KEY + '+R',
    select: 'Enter',
    send: CMD_CTRL_KEY + '+Enter',
    showDatePicker: 'S',
    showLabelEditor: 'L',
    showTimeEstimationPicker: 'F',
    up: 'J',
})

export type TKeyboardShortcuts = keyof typeof KEYBOARD_SHORTCUTS

export const TASK_HEIGHT = '36px'
