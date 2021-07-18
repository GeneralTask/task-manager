import { TSetting, TTaskSection } from './../helpers/types'
import * as actions from './actionTypes'
import { AnyAction } from 'redux'
import { DragState, FetchStatus } from './enums'

export function setTasks(task_sections: TTaskSection[]): AnyAction {
    return {
        type: actions.SET_TASKS,
        task_sections,
    }
}

// tasks_fetch_status is from enums.js - FetchStatus
export function setTasksFetchStatus(tasks_fetch_status: FetchStatus): AnyAction {
    return {
        type: actions.SET_TASKS_FETCH_STATUS,
        tasks_fetch_status,
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

export function setTasksDragState(dragState: DragState): AnyAction {
    return {
        type: actions.SET_TASKS_DRAG_STATE,
        dragState,
    }
}