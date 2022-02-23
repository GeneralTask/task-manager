import { Indices, TTaskSection } from './types'
import {
    LANDING_PATH,
    LINKED_ACCOUNTS_URL,
    LOGOUT_URL,
    LOG_EVENTS_URL,
    REACT_APP_COOKIE_DOMAIN,
    REACT_APP_FRONTEND_BASE_URL,
} from '../constants'
import { useEffect, useState } from 'react'

import { AbortID } from './enums'
import Cookies from 'js-cookie'
import { LogEvents } from './enums'
import _ from 'lodash'
import { setAuthToken } from '../redux/userDataSlice'
import store from '../redux/store'
import { DateTime } from 'luxon'

// This invalidates the cookie on the frontend
export const logout = async (): Promise<void> => {
    await makeAuthorizedRequest({
        url: LOGOUT_URL,
        method: 'POST',
        logoutReq: true,
    })
    Cookies.remove('authToken', { path: '/', domain: REACT_APP_COOKIE_DOMAIN })
    store.dispatch(setAuthToken(undefined))
    document.location.href = LANDING_PATH
}

export const getAuthToken = (): string | undefined => store.getState().user_data.auth_token

export const getHeaders = (): Record<string, string> => {
    const date = new Date()
    return {
        Authorization: 'Bearer ' + getAuthToken(),
        'Access-Control-Allow-Origin': String(REACT_APP_FRONTEND_BASE_URL),
        'Access-Control-Allow-Headers':
            'Authorization,Access-Control-Allow-Origin,Access-Control-Allow-Headers,Access-Control-Allow-Methods,Timezone-Offset',
        'Access-Control-Allow-Methods': 'POST,OPTIONS,GET,PATCH,DELETE',
        'Timezone-Offset': date.getTimezoneOffset().toString(),
    }
}

const abortControllers = new Map<AbortID, AbortController>([[AbortID.TASKS, new AbortController()]])

interface fetchParams {
    url: string
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
    params?: Record<string, string>
    body?: string
    logoutReq?: boolean
    abortID?: AbortID
}

export const makeAuthorizedRequest = async (params: fetchParams): Promise<Response> => {
    if (params.abortID != null) {
        abortControllers.get(params.abortID)?.abort()
        abortControllers.set(params.abortID, new AbortController())
    }
    let url = params.url
    if (params.params != null) {
        url += '?'
        url += new URLSearchParams(params.params).toString()
    }
    const response = await fetch(url, {
        method: params.method,
        mode: 'cors',
        headers: getHeaders(),
        body: params.body,
        signal: params.abortID != null ? abortControllers.get(params.abortID)?.signal : undefined,
    })
    if (!params?.logoutReq && response.status === 401) {
        logout()
    }
    return response
}

export const getLinkedAccountsURL = (account_id: string): string => LINKED_ACCOUNTS_URL + account_id + '/'

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
export function emptyFunction(): void {}

export const updateOrderingIds = (task_sections: TTaskSection[]): TTaskSection[] => {
    return task_sections.map((section) => {
        let idOrdering = 1
        section.tasks?.forEach((task) => (task.id_ordering = idOrdering++))
        return section
    })
}

export function taskDropReorder(
    staleTaskSections: TTaskSection[],
    dragIndices: Indices,
    dropIndices: Indices,
    isLowerHalf: boolean
): TTaskSection[] {
    const taskSections = _.cloneDeep(staleTaskSections)
    const dragTaskObject = taskSections[dragIndices.section].tasks.splice(dragIndices.task, 1)[0]
    const taskGroup = taskSections[dropIndices.section]
    if (dragIndices.section === dropIndices.section && dragIndices.task < dropIndices.task) {
        taskGroup.tasks.splice(dropIndices.task + Number(isLowerHalf) - 1, 0, dragTaskObject)
    } else {
        taskGroup.tasks.splice(dropIndices.task + Number(isLowerHalf), 0, dragTaskObject)
    }
    return updateOrderingIds(taskSections)
}

export function navbarDropReorder(
    staleTaskSections: TTaskSection[],
    newSectionIndex: number,
    indices: Indices
): TTaskSection[] {
    const taskSections = _.cloneDeep(staleTaskSections)
    const dragTaskObject = taskSections[indices.section].tasks[indices.task]
    taskSections[indices.section].tasks.splice(indices.task, 1)

    const section = taskSections[newSectionIndex]
    if (section == null) return taskSections
    if (section.tasks == null) section.tasks = []
    section.tasks.splice(0, 0, dragTaskObject)

    return updateOrderingIds(taskSections)
}

export function sectionDropReorder(
    staleTaskSections: TTaskSection[],
    newSectionIndex: number,
    indices: Indices
): TTaskSection[] {
    const taskSections = _.cloneDeep(staleTaskSections)

    const dragTaskObject = taskSections[indices.section].tasks[indices.task]
    taskSections[indices.section].tasks.splice(indices.task, 1)

    const section = taskSections[newSectionIndex]
    if (section == null) return taskSections
    if (section.tasks == null) section.tasks = []
    section.tasks.splice(0, 0, dragTaskObject)

    return updateOrderingIds(taskSections)
}

// duration in seconds
export function useInterval(func: () => void, seconds: number, callFuncImmediately = true): void {
    useEffect(() => {
        if (callFuncImmediately) func()
        const interval = setInterval(func, seconds * 1000)
        return () => clearInterval(interval)
    }, [func, seconds])
}

export function logEvent(event_type: LogEvents): void {
    makeAuthorizedRequest({
        url: LOG_EVENTS_URL,
        method: 'POST',
        body: JSON.stringify({ event_type }),
    })
}

export function dateIsToday(date: DateTime): boolean {
    const today = DateTime.now()
    return date.day === today.day && date.month === today.month && date.year === today.year
}

export function stopKeyboardPropogation(e: React.KeyboardEvent) {
    if (e.key !== 'Escape') {
        e.stopPropagation()
    }
}

export function useClickOutside(ref: React.RefObject<HTMLElement>, handler: () => void): void {
    useEffect(() => {
        const listener = (event: MouseEvent) => {
            if (!ref.current || ref.current.contains(event.target as Node)) {
                return
            }
            handler()
        }
        document.addEventListener('click', listener, true)
        return () => {
            document.removeEventListener('click', listener, true)
        }
    }, [ref, handler])
}
