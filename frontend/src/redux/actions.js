import * as actions from './actionTypes';

export function setTasks(tasks){
    return {
        type: actions.SET_TASKS,
        tasks
    }
}