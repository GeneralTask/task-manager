import * as actions from './actionTypes';

export default function reducer(state, action){
    switch (action.type) {
        case actions.SET_TASKS:
            return {
                ...state,
                tasks: [...state.tasks, action.task]
            }
        default:
            return state;
    }
}


