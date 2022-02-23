import { FetchStatusEnum, ModalEnum } from '../helpers/enums'
import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { SelectionInfo, TEvent, TTask, TTaskSection } from '../helpers/types'

export interface TasksPageState {
    tasks: {
        task_sections: TTaskSection[]
        fetch_status: FetchStatusEnum
        date_picker: string | null
        time_estimate: string | null
        label_selector: string | null
        focus_create_task_form: boolean
        selection_info: SelectionInfo
    }
    events: {
        event_list: TEvent[]
        fetch_status: FetchStatusEnum
        show_calendar_sidebar: boolean
        show_full_calendar: boolean
    }
    modals: {
        show_modal: ModalEnum
    }
}

const initialState: TasksPageState = {
    tasks: {
        task_sections: [],
        fetch_status: FetchStatusEnum.LOADING,
        date_picker: null,
        time_estimate: null,
        label_selector: null,
        focus_create_task_form: false,
        selection_info: {
            id: null,
            show_keyboard_indicator: false,
            is_body_expanded: false,
        },
    },
    events: {
        event_list: [],
        fetch_status: FetchStatusEnum.LOADING,
        show_calendar_sidebar: true,
        show_full_calendar: false,
    },
    modals: {
        show_modal: ModalEnum.NONE,
    },
}

export const tasksPageSlice = createSlice({
    name: 'tasks_page',
    initialState,
    reducers: {
        setTasks: (state, action: PayloadAction<TTaskSection[]>) => {
            state.tasks.task_sections = action.payload
        },
        addTask: (state, action: PayloadAction<{ task: TTask; sectionIndex: number; taskIndex: number }>) => {
            state.tasks.task_sections[action.payload.sectionIndex].tasks.splice(
                action.payload.taskIndex,
                0,
                action.payload.task
            )
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
        showDatePicker(state, action: PayloadAction<string>) {
            state.tasks.time_estimate = null
            state.tasks.label_selector = null
            state.tasks.date_picker = action.payload
        },
        hideDatePicker(state) {
            state.tasks.date_picker = null
        },
        showTimeEstimate(state, action: PayloadAction<string>) {
            state.tasks.date_picker = null
            state.tasks.label_selector = null
            state.tasks.time_estimate = action.payload
        },
        hideTimeEstimate(state) {
            state.tasks.time_estimate = null
        },
        showLabelSelector(state, action: PayloadAction<string>) {
            state.tasks.date_picker = null
            state.tasks.time_estimate = null
            state.tasks.label_selector = action.payload
        },
        hideLabelSelector(state) {
            state.tasks.label_selector = null
        },
        setFocusCreateTaskForm(state, action: PayloadAction<boolean>) {
            state.tasks.focus_create_task_form = action.payload
        },
        setSelectionInfo(
            state,
            action: PayloadAction<{
                id?: string | null
                show_keyboard_indicator?: boolean
                is_body_expanded?: boolean
            }>
        ) {
            if (action.payload.id !== undefined) {
                state.tasks.selection_info.id = action.payload.id
            }
            if (action.payload.show_keyboard_indicator !== undefined) {
                state.tasks.selection_info.show_keyboard_indicator = action.payload.show_keyboard_indicator
            }
            if (action.payload.is_body_expanded !== undefined) {
                state.tasks.selection_info.is_body_expanded = action.payload.is_body_expanded
            }
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
        },
        setShowFullCalendar(state, action: PayloadAction<boolean>) {
            state.events.show_full_calendar = action.payload
        },
        setShowModal(state, action: PayloadAction<ModalEnum>) {
            state.modals.show_modal = action.payload
        },
    },
})

export const {
    setTasks,
    addTask,
    setTasksFetchStatus,
    removeTaskByID,
    setFocusCreateTaskForm,
    showDatePicker,
    hideDatePicker,
    showTimeEstimate,
    hideTimeEstimate,
    showLabelSelector,
    hideLabelSelector,
    setSelectionInfo,

    // events
    setEvents,
    setEventsFetchStatus,
    setShowCalendarSidebar,
    setShowFullCalendar,
    setShowModal,
} = tasksPageSlice.actions

export default tasksPageSlice.reducer
