import Cookies from 'js-cookie'
import {
    LANDING_PATH,
    LINKED_ACCOUNTS_URL,
    LOGOUT_URL,
    REACT_APP_COOKIE_DOMAIN,
    REACT_APP_FRONTEND_BASE_URL,
    TASKS_URL
} from '../constants'
import {setTasks, setTasksDragState, setTasksFetchStatus} from '../redux/actions'
import {DragState, FetchStatus} from '../redux/enums'
import store from '../redux/store'
import {TTaskSection} from './types'

// This invalidates the cookie on the frontend
// We'll probably want to set up a more robust logout involving the backend
export const logout = (): void => {
    makeAuthorizedRequest({
        url: LOGOUT_URL,
        method: 'POST',
    }, true).then(() => {
        Cookies.remove('authToken', {path: '/', domain: REACT_APP_COOKIE_DOMAIN})
        document.location.href = LANDING_PATH
    })
}

export const getAuthToken = (): string | undefined => Cookies.get('authToken')

export const getHeaders = (): Record<string, string> => {
    const date = new Date()
    return ({
        Authorization: 'Bearer ' + getAuthToken(),
        'Access-Control-Allow-Origin': String(REACT_APP_FRONTEND_BASE_URL),
        'Access-Control-Allow-Headers': 'Authorization,Access-Control-Allow-Origin,Access-Control-Allow-Headers,Access-Control-Allow-Methods,Timezone-Offset',
        'Access-Control-Allow-Methods': 'POST,OPTIONS,GET,PATCH,DELETE',
        'Timezone-Offset': date.getTimezoneOffset().toString(),
    })
}

interface fetchParams {
    url: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    body?: string,
}

export const makeAuthorizedRequest = async (params: fetchParams, logoutReq = false): Promise<Response> => {
    const body = params.body ? params.body : null
    const response = await fetch(params.url, {
        method: params.method,
        mode: 'cors',
        headers: getHeaders(),
        body,
    })
    if (!logoutReq && response.status === 401) {
        logout()
    }
    return response
}

export const resetOrderingIds = (task_sections: TTaskSection[]): void => {
    for (const taskSection of task_sections) {
        let id_ordering = 1
        for (const taskGroup of taskSection.task_groups) {
            for (const task of taskGroup.tasks) {
                task.id_ordering = id_ordering++
            }
        }
    }
}

export const getLinkedAccountsURL = (account_id: string): string => LINKED_ACCOUNTS_URL + account_id + '/'

export const fetchTasks = async (): Promise<void> => {
    const dragState = store.getState().tasks_drag_state
    if (dragState !== DragState.noDrag) {
        store.dispatch(setTasksDragState(DragState.fetchDelayed))
        return
    }
    store.dispatch(setTasksFetchStatus(FetchStatus.LOADING))
    try {
        const response = await makeAuthorizedRequest({
            url: TASKS_URL,
            method: 'GET',
        })
        if (!response.ok) {
            throw new Error('/tasks api call failed')
        } else {
            const resj = await response.json()
            store.dispatch(setTasksFetchStatus(FetchStatus.SUCCESS))
            store.dispatch(setTasks(resj))
        }
    } catch (e) {
        store.dispatch(setTasksFetchStatus(FetchStatus.ERROR))
        console.log({e})
    }
}