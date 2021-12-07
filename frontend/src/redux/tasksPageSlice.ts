import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { TFetchStatus, TTaskSection } from '../helpers/types'

import { FetchStatusEnum } from './enums'
import { emptyFunction } from '../helpers/utils'

export interface TasksPageState {
    task_sections: TTaskSection[],
    tasks_fetch_status: TFetchStatus,
    expanded_body: string | null,
    show_create_task_form: boolean,
}

const initialState: TasksPageState = {
    task_sections: [],
    tasks_fetch_status: {
        status: FetchStatusEnum.LOADING,
        abort_fetch: emptyFunction,
    },
    expanded_body: null,
    show_create_task_form: false,
}

export const tasksSlice = createSlice({
    name: 'tasks_page',
    initialState,
    reducers: {
        setTasks: (state, action: PayloadAction<TTaskSection[]>) => {
            state.task_sections = action.payload
        },
        setTasksFetchStatus: (state, action: PayloadAction<FetchStatusEnum>) => {
            state.tasks_fetch_status.status = action.payload
        },
        setTasksFetchAbortFunction: (state, action: PayloadAction<() => void>) => {
            state.tasks_fetch_status.abort_fetch = action.payload
        },
        removeTaskByID(state, action: PayloadAction<string>) {
            for (const task_section of state.task_sections) {
                for (const task_group of task_section.task_groups) {
                    for (let i = 0; i < task_group.tasks.length; i++) {
                        if (task_group.tasks[i].id === action.payload) {
                            task_group.tasks.splice(i, 1)
                        }
                    }
                }
            }
        },
        expandBody(state, action: PayloadAction<string>) {
            state.expanded_body = action.payload
        },
        collapseBody(state) {
            state.expanded_body = null
        },
        setShowCreateTaskForm(state, action: PayloadAction<boolean>) {
            state.show_create_task_form = action.payload
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
} = tasksSlice.actions

export default tasksSlice.reducer