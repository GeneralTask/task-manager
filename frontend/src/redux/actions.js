import * as actions from './actionTypes';

export function setTasks(task_groups){
    return {
        type: actions.SET_TASKS,
        task_groups,
    }
}

// tasks_fetch_status is from enums.js - FetchStatus
export function setTasksFetchStatus(tasks_fetch_status){
    return {
        type: actions.SET_TASKS_FETCH_STATUS,
        tasks_fetch_status,
    }
}

export function removeTask(index) {
    return {
        type: actions.REMOVE_TASK,
        index
    }
}

export function removeTaskById(id) {
    return {
        type: actions.REMOVE_TASK_BY_ID,
        id,
    }
}

export function expandBody(task_id) {
    return {
        type: actions.EXPAND_BODY,
        task_id,
    }
}

export function retractBody() {
    return {
        type: actions.RETRACT_BODY,
    }
}
