import { Indices, TTaskGroupType, TTaskSection } from './types'
import {
    LANDING_PATH,
    LINKED_ACCOUNTS_URL,
    LOGOUT_URL,
    REACT_APP_COOKIE_DOMAIN,
    REACT_APP_FRONTEND_BASE_URL,
    TASKS_URL
} from '../constants'
import { setTasks, setTasksFetchAbortFunction, setTasksFetchStatus } from '../redux/tasksPageSlice'
import { useAppDispatch, useAppSelector } from '../redux/hooks'
import { useCallback, useEffect, useRef, useState } from 'react'

import Cookies from 'js-cookie'
import { FetchStatusEnum } from '../redux/enums'
import _ from 'lodash'
import { useDragDropManager } from 'react-dnd'

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
        // pass our abort function back to the caller
        params.abortCallback(() => controller.abort())
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

export const getLinkedAccountsURL = (account_id: string): string => LINKED_ACCOUNTS_URL + account_id + '/'

// making this a hook for now before we switch over to RTK Query
export const useFetchTasks = (): () => Promise<void> => {
    const dispatch = useAppDispatch()
    const { tasksFetchStatus } = useAppSelector(state => ({
        tasksFetchStatus: state.tasks_page.tasks_fetch_status,
    }))
    const fetchStatusRef = useRef(tasksFetchStatus)
    useEffect(() => {
        fetchStatusRef.current = tasksFetchStatus
    }, [tasksFetchStatus])

    const dragDropMonitor = useDragDropManager().getMonitor()

    const fetchTasks = useCallback(async () => {
        const isDragging = dragDropMonitor.isDragging()
        const fetchStatus = fetchStatusRef.current
        if (isDragging) {
            return
        }
        if (fetchStatus.status === FetchStatusEnum.LOADING) {
            // abort inflight request
            fetchStatus.abort_fetch()
            setTasksFetchAbortFunction(emptyFunction)
        }
        try {
            const response = await makeAuthorizedRequest({
                url: TASKS_URL,
                method: 'GET',
                abortCallback: (abort_fetch: () => void) => {
                    // get abort function from makeAuthorizedRequest, then make it available in redux state
                    dispatch(setTasksFetchAbortFunction(abort_fetch))
                    dispatch(setTasksFetchStatus(FetchStatusEnum.LOADING))
                }
            })
            if (!response.ok) {
                dispatch(setTasksFetchStatus(FetchStatusEnum.ERROR))
            } else {
                const resj = await response.json()
                dispatch(setTasksFetchStatus(FetchStatusEnum.SUCCESS))
                dispatch(setTasks(resj))
            }
        } catch (e) {
            console.log({ e })
        }
    }, [])

    return fetchTasks
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

export const updateOrderingIds = (task_sections: TTaskSection[]): TTaskSection[] => {
    return task_sections.map((section) => {
        let idOrdering = 1
        section.task_groups.forEach((group) => {
            group.tasks.forEach((task) => task.id_ordering = idOrdering++)
        })
        return section
    })
}

export function taskDropReorder(staleTaskSections: TTaskSection[], dragIndices: Indices, dropIndices: Indices, isLowerHalf: boolean): TTaskSection[] {
    const taskSections = _.cloneDeep(staleTaskSections)
    const dragTaskObject = taskSections[dragIndices.section].task_groups[dragIndices.group].tasks.splice(dragIndices.task, 1)[0]
    const taskGroup = taskSections[dropIndices.section].task_groups[dropIndices.group]

    if (taskGroup.type === TTaskGroupType.SCHEDULED_TASK) {
        if (isLowerHalf) {
            taskSections[dropIndices.section].task_groups[dropIndices.group + 1].tasks.push(dragTaskObject)
        }
        else taskSections[dropIndices.section].task_groups[dropIndices.group - 1].tasks.push(dragTaskObject)
    }
    else {
        if (dragIndices.section === dropIndices.section
            && dragIndices.group === dropIndices.group
            && dragIndices.task < dropIndices.task) {
            taskGroup.tasks.splice(dropIndices.task + Number(isLowerHalf) - 1, 0, dragTaskObject)
        }
        else {
            taskGroup.tasks.splice(dropIndices.task + Number(isLowerHalf), 0, dragTaskObject)
        }
    }
    return updateOrderingIds(taskSections)
}

export function sectionDropReorder(staleTaskSections: TTaskSection[], newSectionIndex: number, indices: Indices): TTaskSection[] {
    const taskSections = _.cloneDeep(staleTaskSections)

    const dragTaskObject = taskSections[indices.section].task_groups[indices.group].tasks[indices.task]
    taskSections[indices.section].task_groups[indices.group].tasks.splice(indices.task, 1)

    const section = taskSections[newSectionIndex]
    if (section == null || section.task_groups.length === 0) return taskSections
    if (section.task_groups[0].type !== TTaskGroupType.UNSCHEDULED_GROUP) return taskSections
    section.task_groups[0].tasks.splice(0, 0, dragTaskObject)

    return updateOrderingIds(taskSections)
}
