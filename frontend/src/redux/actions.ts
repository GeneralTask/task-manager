import { TSetting, TTaskGroup } from './../helpers/types'
import * as actions from './actionTypes'
import { AnyAction } from 'redux'
import { FetchStatus } from './enums'


export function setTasks(task_groups: TTaskGroup[]): AnyAction {
    return {
        type: actions.SET_TASKS,
        task_groups,
    }
}

// tasks_fetch_status is from enums.js - FetchStatus
export function setTasksFetchStatus(tasks_fetch_status: FetchStatus): AnyAction {
    return {
        type: actions.SET_TASKS_FETCH_STATUS,
        tasks_fetch_status,
    }
}

export function removeTask(index: number): AnyAction {
    return {
        type: actions.REMOVE_TASK,
        index
    }
}

export function removeTaskById(id: string): AnyAction {
    return {
        type: actions.REMOVE_TASK_BY_ID,
        id,
    }
}

export function expandBody(task_id: string): AnyAction {
    return {
        type: actions.EXPAND_BODY,
        task_id,
    }
}

export function retractBody(): AnyAction {
    return {
        type: actions.RETRACT_BODY,
    }
}

export function setSettings(settings: TSetting[]): AnyAction {
    return {
        type: actions.SET_SETTINGS,
        settings,
    }
}

export function setFocus(task_id: string): AnyAction {
    return {
        type: actions.SET_FOCUS,
        task_id,
    }
}
