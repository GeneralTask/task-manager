import Cookies from 'js-cookie'
import {LANDING_PATH, LOGOUT_URL, REACT_APP_COOKIE_DOMAIN, REACT_APP_FRONTEND_BASE_URL} from '../constants'
import { TTaskGroup } from './types'

// This invalidates the cookie on the frontend
// We'll probably want to set up a more robust logout involving the backend
export const logout = (): void => {
    makeAuthorizedRequest({
        url: LOGOUT_URL,
        method: 'POST',
      }).then(() => {
          document.location.href = LANDING_PATH
          Cookies.remove('authToken', {path: '/', domain: REACT_APP_COOKIE_DOMAIN})
        })
}

export const getAuthToken = (): string | undefined => Cookies.get('authToken')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getHeaders = (): any => ({
    Authorization: 'Bearer ' + getAuthToken(),
    'Access-Control-Allow-Origin': REACT_APP_FRONTEND_BASE_URL,
    'Access-Control-Allow-Headers': 'Authorization,Access-Control-Allow-Origin,Access-Control-Allow-Headers,Access-Control-Allow-Methods',
    'Access-Control-Allow-Methods': 'POST,OPTIONS,GET,PATCH',
})

interface fetchParams {
    url: string,
    method: 'GET' | 'POST' | 'PATCH'
    body?: string
}

export const makeAuthorizedRequest = async(params: fetchParams): Promise<Response> => {
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

export const resetOrderingIds = (task_groups: TTaskGroup[]): void => {
    let id_ordering = 1
    for(const taskGroup of task_groups){
        for(const task of taskGroup.tasks){
            task.id_ordering = id_ordering++
        }
    }
}
