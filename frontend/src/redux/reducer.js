import * as actions from './actionTypes';

export default function reducer(state, action){
    switch (action.type) {

        case actions.SET_TASKS:
            return {
                ...state,
                task_groups: action.task_groups
            }

        default:
            return state;
    }
}
