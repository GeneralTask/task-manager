import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { TEvent, TFetchStatus, TTaskSection } from '../helpers/types'

import { FetchStatusEnum } from './enums'
import { emptyFunction } from '../helpers/utils'

export interface TasksPageState {
    tasks: {
        task_sections: TTaskSection[],
        tasks_fetch_status: TFetchStatus,
        expanded_body: string | null,
        show_create_task_form: boolean,
    },
    events: TEvent[],
}

const initialState: TasksPageState = {
    tasks: {
        task_sections: [],
        tasks_fetch_status: {
            status: FetchStatusEnum.LOADING,
            abort_fetch: emptyFunction,
        },
        expanded_body: null,
        show_create_task_form: false,
    },
    events: [],
}

export const tasksPageSlice = createSlice({
    name: 'tasks_page',
    initialState,
    reducers: {
        setTasks: (state, action: PayloadAction<TTaskSection[]>) => {
            state.tasks.task_sections = action.payload
        },
        setTasksFetchStatus: (state, action: PayloadAction<FetchStatusEnum>) => {
            state.tasks.tasks_fetch_status.status = action.payload
        },
        setTasksFetchAbortFunction: (state, action: PayloadAction<() => void>) => {
            state.tasks.tasks_fetch_status.abort_fetch = action.payload
        },
        removeTaskByID(state, action: PayloadAction<string>) {
            for (const task_section of state.tasks.task_sections) {
                for (let i = 0; i < task_section.tasks.length; i++) {
                    if (task_section.tasks[i].id === action.payload) {
                        task_section.tasks.splice(i, 1)
                    }

                }
            }
        },
        expandBody(state, action: PayloadAction<string>) {
            state.tasks.expanded_body = action.payload
        },
        collapseBody(state) {
            state.tasks.expanded_body = null
        },
        setShowCreateTaskForm(state, action: PayloadAction<boolean>) {
            state.tasks.show_create_task_form = action.payload
        },
        setEvents(state, action: PayloadAction<TEvent[]>) {
            state.events = action.payload
        }
    },
})

export const {
    setTasks,
    setTasksFetchStatus,
    setTasksFetchAbortFunction,
    removeTaskByID,
    expandBody,
    collapseBody,
    setShowCreateTaskForm,
    setEvents,
} = tasksPageSlice.actions

export default tasksPageSlice.reducer
