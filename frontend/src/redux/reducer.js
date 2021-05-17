import * as actions from './actionTypes';

export default function reducer(state, action){
    switch (action.type) {

        case actions.SET_TASKS:
            return {
                ...state,
                task_groups: action.task_groups
            }
        
        case actions.SET_TASKS_FETCH_STATUS:
            return {
                ...state,
                tasks_fetch_status: action.tasks_fetch_status,
            }

        case actions.REMOVE_TASK:
            let task_groups = [...state.task_groups];
            task_groups.splice(action.index, 1);
            return {
                ...state,
                task_groups: task_groups
            }

        default:
            return state;
    }
}
