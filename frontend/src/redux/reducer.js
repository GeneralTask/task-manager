import * as actions from './actionTypes';

export default function reducer(state, action){
    switch (action.type) {

        // used for populating both tasks and group_tasks after fetching from /tasks
        case actions.SET_TASKS_AND_GROUPS:
            return {
                ...state,
                tasks: action.tasks,
                group_tasks: action.task_groups
            }
        
        case actions.SET_TASKS:
            return {
                ...state,
                tasks: action.tasks,
            }

        case actions.ADD_TASK:
            return {
                ...state,
                tasks: [...state.tasks, action.task]
            }

        case actions.REMOVE_TASK:
            return {
                ...state,
                tasks: state.tasks.filter(task => task.id !== action.taskId)
            }

        case actions.SET_TASK_GROUPS:
            return {
                ...state,
                group_tasks: action.task_groups
            }

        default:
            return state;
    }
}
