import * as actions from './actionTypes'

import { DragState, FetchStatusEnum } from './enums'
import { TSetting, TTaskSection } from './../helpers/types'

import { AnyAction } from 'redux'
import { emptyFunction } from '../helpers/utils'

export function setTasks(task_sections: TTaskSection[]): AnyAction {
    return {
        type: actions.SET_TASKS,
        task_sections,
    }
}

// tasks_fetch_status is from enums.js - FetchStatusEnum
export function setTasksFetchStatus(status: FetchStatusEnum, abort_fetch: () => void = emptyFunction): AnyAction {
    return {
        type: actions.SET_TASKS_FETCH_STATUS,
        tasks_fetch_status: {
            status,
            abort_fetch,
        }
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

export function sectionDrop(dragTaskId: string, sectionIndex: number) :AnyAction {
    return {
        type: actions.SECTION_DROP,
        dragTaskId,
        sectionIndex,
    }
}
