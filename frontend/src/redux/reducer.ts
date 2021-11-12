import { TTaskSection } from './../helpers/types'
import * as actions from './actionTypes'

import { RootState, initialState } from './store'

import { AnyAction } from 'redux'
import _ from 'lodash'

let task_sections: TTaskSection[]
const reducer = (state: RootState | undefined, action: AnyAction): RootState => {
  if (state == null) {
    return initialState
  }
  switch (action.type) {
    case actions.SET_TASKS:
      return {
        ...state,
        task_sections: action.task_sections,
      }

    case actions.SET_TASKS_FETCH_STATUS:
      return {
        ...state,
        tasks_fetch_status: action.tasks_fetch_status,
      }

    case actions.REMOVE_TASK_BY_ID:
      task_sections = _.cloneDeep(state.task_sections)
      // loops through the tasks and removes the one with the id
      // should pass in section/group indicies to be more efficient
      for (const task_section of task_sections) {
        for (const task_group of task_section.task_groups) {
          for (let i = 0; i < task_group.tasks.length; i++) {
            if (task_group.tasks[i].id === action.id) {
              task_group.tasks.splice(i, 1)
              return {
                ...state,
                task_sections,
              }
            }
          }
        }
      }
      return {
        ...state,
        task_sections,
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

    case actions.SET_TASKS_DRAG_STATE:
      return {
        ...state,
        tasks_drag_state: action.dragState,
      }

    default:
      return state
  }
}

export default reducer
