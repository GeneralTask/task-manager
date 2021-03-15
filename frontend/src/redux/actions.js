import * as actions from './actionTypes';

export function setTasks(tasks){
    if(!tasks){
        tasks = [];
    }
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

export function setGroupTasks(task_groups){
    if(!task_groups){
        task_groups = [];
    }
    return {
        type: actions.SET_TASK_GROUPS,
        task_groups
    }
}
