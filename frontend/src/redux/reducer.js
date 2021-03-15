import * as actions from './actionTypes';

export default function reducer(state, action){
    switch (action.type) {
        
        // tasks will never be set without task_groups        
        case actions.SET_TASKS:
            return {
                ...state,
                tasks: action.tasks,
                group_tasks: action.task_groups
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
