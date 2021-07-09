import { TTask } from './../helpers/types'
import * as actions from './actionTypes'
import { AnyAction } from 'redux'
import { RootState } from './store'
import { FetchStatus } from './enums'

let task_groups
const reducer = (state: RootState | undefined, action: AnyAction): RootState => {
  if (state === undefined) {
    return {
      task_groups: [],
      tasks_fetch_status: FetchStatus.LOADING,
      expanded_body: null,
      settings: [],
      focused_task: null,
    }
  }
  switch (action.type) {
    case actions.SET_TASKS:
      return {
        ...state,
        task_groups: action.task_groups,
      }

    case actions.SET_TASKS_FETCH_STATUS:
      return {
        ...state,
        tasks_fetch_status: action.tasks_fetch_status,
      }

    case actions.REMOVE_TASK:
      task_groups = [...state.task_groups]
      task_groups.splice(action.index, 1)
      return {
        ...state,
        task_groups,
      }

    case actions.REMOVE_TASK_BY_ID:
      task_groups = [...state.task_groups]
      // loops through the tasks and removes the one with the id
      return {
        ...state,
        task_groups: [...state.task_groups].map((task_group) => ({
          ...task_group,
          tasks: task_group.tasks.filter((task: TTask) => task.id !== action.id),
        })),
      }

    case actions.EXPAND_BODY:
      return {
        ...state,
        expanded_body: action.task_id,
      }

    case actions.RETRACT_BODY:
      return {
        ...state,
        expanded_body: null,
      }

    case actions.SET_SETTINGS:
      return {
        ...state,
        settings: action.settings,
      }

    case actions.SET_FOCUS:
      return {
        ...state,
        focused_task: action.task_id,
      }

    default:
      return state
  }
}

export default reducer
