import getEnvVars from './environment'

const { REACT_APP_API_BASE_URL } = getEnvVars()

// Backend Endpoints
export const TASKS_URL = REACT_APP_API_BASE_URL + '/tasks/'
export const MESSAGES_URL = REACT_APP_API_BASE_URL + '/messages/'
export const TASKS_MODIFY_URL = REACT_APP_API_BASE_URL + '/tasks/modify/'
export const MESSAGES_MODIFY_URL = REACT_APP_API_BASE_URL + '/messages/modify/'
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
