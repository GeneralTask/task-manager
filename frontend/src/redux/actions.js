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

export function setGroupedTasks(groupedTasks){
    return {
        type: actions.SET_GROUPED_TASKS,
        groupedTasks
    }
}
