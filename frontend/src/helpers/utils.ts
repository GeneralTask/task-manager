import { DragState, FetchStatusEnum } from '../redux/enums'
import {
    LANDING_PATH,
    LINKED_ACCOUNTS_URL,
    LOGOUT_URL,
    REACT_APP_COOKIE_DOMAIN,
    REACT_APP_FRONTEND_BASE_URL,
    TASKS_URL
} from '../constants'
import { setTasks, setTasksDragState, setTasksFetchStatus } from '../redux/actions'
import { useEffect, useState } from 'react'

import Cookies from 'js-cookie'
import { TTaskSection } from './types'
import store from '../redux/store'

// This invalidates the cookie on the frontend
// We'll probably want to set up a more robust logout involving the backend
export const logout = async (): Promise<void> => {
    await makeAuthorizedRequest({
        url: LOGOUT_URL,
        method: 'POST',
        logoutReq: true,
    })
    Cookies.remove('authToken', { path: '/', domain: REACT_APP_COOKIE_DOMAIN })
    document.location.href = LANDING_PATH
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

    logoutReq?: boolean,
    // optional function that *accepts* an abort function
    abortCallback?: (abort_fetch: () => void) => void,
}

export const makeAuthorizedRequest = async (params: fetchParams): Promise<Response> => {
    const body = params.body ?? null
    let signal: AbortSignal | undefined = undefined
    if (params.abortCallback != null) {
        const controller = new AbortController()
        signal = controller.signal
        // params.abortCallback(controller.abort)
        params.abortCallback(() => {
            controller.abort()
            console.log('aborting request')
        })
    }
    const response = await fetch(params.url, {
        method: params.method,
        mode: 'cors',
        headers: getHeaders(),
        body,
        signal: signal,
    })
    if (!params?.logoutReq && response.status === 401) {
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
    const fetchStatus = store.getState().tasks_fetch_status
    if (fetchStatus.status === FetchStatusEnum.LOADING) {
        // abort inflight request
        fetchStatus.abort_fetch()
    }
    let aborted = false
    try {
        const response = await makeAuthorizedRequest({
            url: TASKS_URL,
            method: 'GET',
            abortCallback: (abort_fetch: () => void) => {
                console.log('callback')
                // store.dispatch(setTasksFetchStatus(FetchStatusEnum.LOADING, abort_fetch))
                store.dispatch(setTasksFetchStatus(FetchStatusEnum.LOADING, () => {
                    abort_fetch()
                    aborted = true
                }))
            }
        })
        console.log({ aborted })
        if (aborted) {
            alert('just had an abortion!!!')
        }
        if (!response.ok) {
            throw new Error('/tasks api call failed')
        } else {
            const resj = await response.json()
            store.dispatch(setTasksFetchStatus(FetchStatusEnum.SUCCESS))
            store.dispatch(setTasks(resj))
        }
    } catch (e) {
        store.dispatch(setTasksFetchStatus(FetchStatusEnum.ERROR))
        console.log({ e })
    }
}

export enum DeviceSize {
    MOBILE,
    DESKTOP,
}
const MOBILE_WIDTH = 768 // common mobile width threshold https://www.w3schools.com/css/css_rwd_mediaqueries.asp

// hook that returns whether the device is mobile or desktop
export const useDeviceSize = (): DeviceSize => {
    const [deviceSize, setDeviceSize] = useState(DeviceSize.MOBILE)
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < MOBILE_WIDTH) {
                setDeviceSize(DeviceSize.MOBILE)
            } else {
                setDeviceSize(DeviceSize.DESKTOP)
            }
        }
        window.addEventListener('resize', handleResize)
        handleResize()
        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [])
    return deviceSize
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function emptyFunction(): void { }
