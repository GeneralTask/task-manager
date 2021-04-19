import * as actions from './actionTypes';

export function setTasks(task_groups){
    return {
        type: actions.SET_TASKS,
        task_groups,
    }
}
