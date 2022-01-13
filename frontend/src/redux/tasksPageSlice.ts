import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { TEvent, TTaskSection } from '../helpers/types'

import { FetchStatusEnum } from '../helpers/enums'

export interface TasksPageState {
    tasks: {
        task_sections: TTaskSection[],
        fetch_status: FetchStatusEnum,
        expanded_body: string | null,
        show_create_task_form: boolean,
    },
    events: {
        event_list: TEvent[],
        fetch_status: FetchStatusEnum,
        show_calendar_sidebar: boolean,
    },
}

const initialState: TasksPageState = {
    tasks: {
        task_sections: [],
        fetch_status: FetchStatusEnum.LOADING,
        expanded_body: null,
        show_create_task_form: false,
    },
    events: {
        event_list: [],
        fetch_status: FetchStatusEnum.LOADING,
        show_calendar_sidebar: true,
    },
}

export const tasksPageSlice = createSlice({
    name: 'tasks_page',
    initialState,
    reducers: {
        setTasks: (state, action: PayloadAction<TTaskSection[]>) => {
            state.tasks.task_sections = action.payload
        },
        setTasksFetchStatus: (state, action: PayloadAction<FetchStatusEnum>) => {
            state.tasks.fetch_status = action.payload
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

        // Events
        setEvents(state, action: PayloadAction<TEvent[]>) {
            state.events.event_list = action.payload
        },
        setEventsFetchStatus(state, action: PayloadAction<FetchStatusEnum>) {
            state.events.fetch_status = action.payload
        },
        setShowCalendarSidebar(state, action: PayloadAction<boolean>) {
            state.events.show_calendar_sidebar = action.payload
        }
    },
})

export const {
    setTasks,
    setTasksFetchStatus,
    removeTaskByID,
    expandBody,
    collapseBody,
    setShowCreateTaskForm,
    setEvents,
    setEventsFetchStatus,
    setShowCalendarSidebar,
} = tasksPageSlice.actions

export default tasksPageSlice.reducer
