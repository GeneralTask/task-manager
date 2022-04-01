import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ModalEnum } from '../utils/enums'

export interface TasksPageState {
    modals: {
        show_modal: ModalEnum
    },
    selected_task_id: string | null,
    expanded_calendar: boolean,
}

const initialState: TasksPageState = {
    modals: {
        show_modal: ModalEnum.NONE,
    },
    selected_task_id: null,
    expanded_calendar: false,
}

export const tasksPageSlice = createSlice({
    name: 'tasks_page',
    initialState,
    reducers: {
        setShowModal(state, action: PayloadAction<ModalEnum>) {
            state.modals.show_modal = action.payload
        },
        setSelectedTaskId(state, action: PayloadAction<string | null>) {
            state.selected_task_id = action.payload
        },
        setExpandedCalendar(state, action: PayloadAction<boolean>) {
            state.expanded_calendar = action.payload
        }
    },
})

export const {
    setShowModal,
    setSelectedTaskId,
    setExpandedCalendar,
} = tasksPageSlice.actions

export default tasksPageSlice.reducer
