import * as actions from './actionTypes';

let task_groups;
export default function reducer(state, action){
    switch (action.type) {
      case actions.SET_TASKS:
        return {
          ...state,
          task_groups: action.task_groups,
        };

      case actions.SET_TASKS_FETCH_STATUS:
        return {
          ...state,
          tasks_fetch_status: action.tasks_fetch_status,
        };

      case actions.REMOVE_TASK:
        task_groups = [...state.task_groups];
        task_groups.splice(action.index, 1);
        return {
          ...state,
          task_groups,
        };

      case actions.REMOVE_TASK_BY_ID:
        task_groups = [...state.task_groups];
        // loops through the tasks and removes the one with the id
        return {
          ...state,
          task_groups: [...state.task_groups].map((task_group) => ({
            ...task_group,
            tasks: task_group.tasks.filter((task) => task.id !== action.id),
          })),
        };

      default:
        return state;
    }
}
