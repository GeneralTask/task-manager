export const { REACT_APP_API_BASE_URL, REACT_APP_FRONTEND_BASE_URL, REACT_APP_COOKIE_DOMAIN, ACCESS_CONTROL_ALLOW_ORIGIN } = process.env

// Backend Endpoints
export const TASKS_URL = REACT_APP_API_BASE_URL + '/tasks/'
export const JIRA_URL = REACT_APP_API_BASE_URL + '/authorize/jira/'
export const LOGIN_URL = REACT_APP_API_BASE_URL + '/login/'
export const SETTINGS_URL = REACT_APP_API_BASE_URL + '/settings/'
export const WAITLIST_URL = REACT_APP_API_BASE_URL + '/waitlist/'
export const LINKED_ACCOUNTS_URL = REACT_APP_API_BASE_URL + '/linked_accounts/'

// Frontend paths
export const LANDING_PATH = '/'
export const SETTINGS_PATH = '/settings/'
export const PRIVACY_PATH = '/privacy/'

//Google Sign-In SVGs
export const GOOGLE_LIGHT_NORMAL = '/assets/google_signin_buttons/google_btn_normal.svg'
export const GOOGLE_LIGHT_FOCUS = '/assets/google_signin_buttons/google_btn_focus.svg'
export const GOOGLE_LIGHT_PRESSED = '/assets/google_signin_buttons/google_btn_pressed.svg'
export const GOOGLE_LIGHT_DISABLED = '/assets/google_signin_buttons/google_btn_disabled.svg'

export const TASK_GROUP_SCHEDULED_TASK = 'scheduled_task'
export const TASK_GROUP_UNSCHEDULED_GROUP = 'unscheduled_group'

//images
export const CHEVRON_DOWN = '/images/chevron-arrow-down.svg'

//Misc. strings
export const TASK_STATUS_FETCH_ERROR = 'There was an error fetching tasks'
export const TASK_STATUS_NO_TASKS = 'No Tasks'
export const MAX_TASK_BODY_HEIGHT = 300
