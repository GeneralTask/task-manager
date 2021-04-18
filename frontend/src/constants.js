export const {REACT_APP_API_BASE_URL, REACT_APP_FRONTEND_BASE_URL} = process.env
console.log({REACT_APP_API_BASE_URL});

// Backend Endpoints
export const TASKS_URL = REACT_APP_API_BASE_URL + '/tasks/'
export const JIRA_URL = REACT_APP_API_BASE_URL + '/jira/authorize/'
export const LOGIN_URL = REACT_APP_API_BASE_URL + '/login/'

// Frontend paths
export const LANDING_PATH = '/'
export const SETTINGS_PATH = '/settings/'


//Google Sign-In SVGs
export const GOOGLE_LIGHT_NORMAL = '/assets/google_signin_buttons/google_btn_normal.svg'
export const GOOGLE_LIGHT_FOCUS = '/assets/google_signin_buttons/google_btn_focus.svg'
export const GOOGLE_LIGHT_PRESSED = '/assets/google_signin_buttons/google_btn_pressed.svg'
export const GOOGLE_LIGHT_DISABLED = '/assets/google_signin_buttons/google_btn_disabled.svg'

export const TASK_GROUP_SCHEDULED_TASK = "scheduled_task"
export const TASK_GROUP_UNSCHEDULED_GROUP = "unscheduled_group"