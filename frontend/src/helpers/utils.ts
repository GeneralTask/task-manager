import Cookies from 'js-cookie'
import {LANDING_PATH, REACT_APP_COOKIE_DOMAIN, REACT_APP_FRONTEND_BASE_URL} from '../constants'

export const getAuthToken = (): string | undefined => Cookies.get('authToken')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getHeaders = (): any => ({
    Authorization: 'Bearer ' + getAuthToken(),
    'Access-Control-Allow-Origin': REACT_APP_FRONTEND_BASE_URL,
    'Access-Control-Allow-Headers': 'access-control-allow-origin, access-control-allow-haders',
})

interface fetchParams {
    url: string,
    method: 'GET' | 'POST' | 'PATCH'
    body?: string
}

// This invalidates the cookie on the frontend
// We'll probably want to set up a more robust logout involving the backend
export const logout = () => {
    Cookies.remove('authToken', {path: '/', domain: REACT_APP_COOKIE_DOMAIN})
    document.location.href = LANDING_PATH
}

export const makeAuthorizedRequest = async(params: fetchParams) => {
    const response = await fetch(params.url, {
        method: params.method,
        mode: 'cors',
        headers: getHeaders(),
        body: params.body,
    })
    if(response.status === 401){
        logout()
    }
    return response
}
