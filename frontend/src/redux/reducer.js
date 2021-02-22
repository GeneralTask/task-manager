import * as actions from './actionTypes';

export default function reducer(state, action){
    switch (action.type) {
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
                tasks: state.tasks.filter(task => task.id != action.taskId)
            }

        default:
            return state;
    }
}


