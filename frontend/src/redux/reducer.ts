import { TTask, TTaskGroupType, TTaskSection } from './../helpers/types'
import * as actions from './actionTypes'
import { AnyAction } from 'redux'
import { RootState } from './store'
import { DragState, FetchStatus } from './enums'
import _ from 'lodash'

let task_sections: TTaskSection[]
let dragTaskObject: TTask | null = null
const reducer = (state: RootState | undefined, action: AnyAction): RootState => {
  if (state === undefined) {
    return {
      task_sections: [],
      tasks_fetch_status: FetchStatus.LOADING,
      tasks_drag_state: DragState.noDrag,
      expanded_body: null,
      settings: [],
    }
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
    
    case actions.DRAG_DROP:
      if (action.dropTask === null) return state
      if (action.dragTaskId === action.dropTaskId) return state
      task_sections = _.cloneDeep(state.task_sections)

      // Find dragged object and remove
      for (const task_section of task_sections) {
        for (const task_group of task_section.task_groups) {
          for (let i = 0; i < task_group.tasks.length; i++) {
            if (task_group.tasks[i].id === action.dragTaskId) {
              dragTaskObject = task_group.tasks[i]
              task_group.tasks.splice(i, 1)
            }
          }
        }
      }

      // Insert dragged object into new position
      for (const task_section of task_sections) {
        for (const task_group of task_section.task_groups) {
          for (let i = 0; i < task_group.tasks.length; i++) {
            if (task_group.tasks[i].id === action.dropTaskId && dragTaskObject !== null) {
              task_group.tasks.splice(i + action.isLowerHalf, 0, dragTaskObject)
              return {
                ...state,
                task_sections
              }
            }
          }
        }
      }
      return state

    case actions.SECTION_DROP:
      if (action.dropTaskId == null) return state
      if (action.sectionIndex == null) return state
      if (action.sectionIndex >= state.task_sections.length) return state
      
      task_sections = _.cloneDeep(state.task_sections)

      // Find dragged object and remove
      for (const task_section of task_sections) {
        for (const task_group of task_section.task_groups) {
          for (let i = 0; i < task_group.tasks.length; i++) {
            if (task_group.tasks[i].id === action.dragTaskId) {
              dragTaskObject = task_group.tasks[i]
              task_group.tasks.splice(i, 1)
            }
          }
        }
      }
      if (dragTaskObject === null) return state

      // Insert dragged task into top of section
      const task_section_drop = task_sections[action.sectionIndex]
      if (task_section_drop.task_groups.length === 0) return state
      if (task_section_drop.task_groups[0].type !== TTaskGroupType.UNSCHEDULED_GROUP) return state
      task_section_drop.task_groups[0].tasks.splice(0,0,dragTaskObject)

      return {
        ...state,
        task_sections
      }
      
    default:
      return state
  }
}

export default reducer
