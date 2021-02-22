import * as actions from './actionTypes';

export function setTasks(tasks){
    return {
        type: actions.SET_TASKS,
        tasks
    }
}

export function addTask(task){
    return {
        type: actions.ADD_TASK,
        task
    }
}

export function removeTask(taskId){
    return {
        type: actions.REMOVE_TASK,
        taskId
    }
}
