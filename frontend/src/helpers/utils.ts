import { Indices, TTaskSection } from './types'
import {
    LANDING_PATH,
    LINKED_ACCOUNTS_URL,
    LOGOUT_URL,
    REACT_APP_COOKIE_DOMAIN,
    REACT_APP_FRONTEND_BASE_URL
} from '../constants'
import { useEffect, useState } from 'react'

import Cookies from 'js-cookie'
import _ from 'lodash'
import { AbortID } from '../redux/enums'

// This invalidates the cookie on the frontend
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

const abortControllers = new Map<AbortID, AbortController>([
    [AbortID.TASKS, new AbortController()]
])

interface fetchParams {
    url: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    params?: Record<string, string>,
    body?: string,
    logoutReq?: boolean,
    abortID?: AbortID,
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
export function emptyFunction(): void { }

export const updateOrderingIds = (task_sections: TTaskSection[]): TTaskSection[] => {
    return task_sections.map((section) => {
        let idOrdering = 1
        section.tasks.forEach((task) => task.id_ordering = idOrdering++)
        return section
    })
}

export function taskDropReorder(staleTaskSections: TTaskSection[], dragIndices: Indices, dropIndices: Indices, isLowerHalf: boolean): TTaskSection[] {
    const taskSections = _.cloneDeep(staleTaskSections)
    const dragTaskObject = taskSections[dragIndices.section].tasks.splice(dragIndices.task, 1)[0]
    const taskGroup = taskSections[dropIndices.section]
    if (dragIndices.section === dropIndices.section
        && dragIndices.task < dropIndices.task) {
        taskGroup.tasks.splice(dropIndices.task + Number(isLowerHalf) - 1, 0, dragTaskObject)
    }
    else {
        taskGroup.tasks.splice(dropIndices.task + Number(isLowerHalf), 0, dragTaskObject)
    }
    return updateOrderingIds(taskSections)
}

export function sectionDropReorder(staleTaskSections: TTaskSection[], newSectionIndex: number, indices: Indices): TTaskSection[] {
    const taskSections = _.cloneDeep(staleTaskSections)

    const dragTaskObject = taskSections[indices.section].tasks[indices.task]
    taskSections[indices.section].tasks.splice(indices.task, 1)

    const section = taskSections[newSectionIndex]
    if (section == null) return taskSections
    section.tasks.splice(0, 0, dragTaskObject)

    return updateOrderingIds(taskSections)
}

// duration in seconds
export function useInterval(func: () => void, duration: number): void {
    useEffect(() => {
        func()
        const interval = setInterval(func, duration * 1000)
        return () => clearInterval(interval)
    }, [func, duration])
}
