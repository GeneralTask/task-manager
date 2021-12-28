export const {
    REACT_APP_API_BASE_URL,
    REACT_APP_FRONTEND_BASE_URL,
    REACT_APP_COOKIE_DOMAIN,
    ACCESS_CONTROL_ALLOW_ORIGIN
} = process.env

// Backend Endpoints
export const TASKS_URL = REACT_APP_API_BASE_URL + '/tasks/v2/'
export const TASKS_MODIFY_URL = REACT_APP_API_BASE_URL + '/tasks/modify/'
export const TASKS_CREATE_URL = REACT_APP_API_BASE_URL + '/tasks/create/'
export const ASANA_URL = REACT_APP_API_BASE_URL + '/link/asana/'
export const JIRA_URL = REACT_APP_API_BASE_URL + '/link/jira/'
export const LOGIN_URL = REACT_APP_API_BASE_URL + '/login/'
export const LOGOUT_URL = REACT_APP_API_BASE_URL + '/logout/'
export const SETTINGS_URL = REACT_APP_API_BASE_URL + '/settings/'
export const WAITLIST_URL = REACT_APP_API_BASE_URL + '/waitlist/'
export const LINKED_ACCOUNTS_URL = REACT_APP_API_BASE_URL + '/linked_accounts/'
export const SUPPORTED_TYPES_URL = REACT_APP_API_BASE_URL + '/linked_accounts/supported_types/'

export const EVENTS_URL = REACT_APP_API_BASE_URL + '/events/'

// Frontend paths
export const LANDING_PATH = '/'
export const SETTINGS_PATH = '/settings/'
export const PRIVACY_PATH = '/privacy/'

//Google Sign-In SVGs
export const GOOGLE_LIGHT_NORMAL = '/assets/google_signin_buttons/btn_google_signin_light_normal_web@2x.png'

//images
export const CHEVRON_DOWN = '/images/chevron-arrow-down.svg'
export const DONE_BUTTON = '/images/CheckCircle.svg'

//Misc. strings
export const TASK_STATUS_FETCH_ERROR = 'There was an error fetching tasks'
export const TASK_STATUS_NO_TASKS = 'No Tasks'
export const MAX_TASK_BODY_HEIGHT = 495
export const TOAST_DURATION = 5000
export const TASKS_FETCH_INTERVAL = 30

export const GT_TASK_SOURCE_ID = 'gt_task'
export const NOW = 'Now'
