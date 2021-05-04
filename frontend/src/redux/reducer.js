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

        default:
            return state;
    }
}
