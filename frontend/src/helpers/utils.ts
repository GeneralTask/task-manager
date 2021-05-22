import Cookies from 'js-cookie'
import {REACT_APP_FRONTEND_BASE_URL} from '../constants'

export const getAuthToken = (): string | undefined => Cookies.get('authToken')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getHeaders = (): any => ({
    Authorization: 'Bearer ' + getAuthToken(),
    'Access-Control-Allow-Origin': REACT_APP_FRONTEND_BASE_URL,
    'Access-Control-Allow-Heeaders': 'access-control-allow-origin, access-control-allow-haders',
})