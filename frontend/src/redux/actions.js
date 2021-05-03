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
