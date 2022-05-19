import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ModalEnum } from '../utils/enums'

export interface TasksPageState {
    modals: {
        show_modal: ModalEnum
    },
    expanded_calendar: boolean
}

const initialState: TasksPageState = {
    modals: {
        show_modal: ModalEnum.NONE,
    },
    expanded_calendar: false,
}

export const tasksPageSlice = createSlice({
    name: 'tasks_page',
    initialState,
    reducers: {
        setShowModal(state, action: PayloadAction<ModalEnum>) {
            state.modals.show_modal = action.payload
        },
        setExpandedCalendar(state, action: PayloadAction<boolean>) {
            state.expanded_calendar = action.payload
        },
    },
})

export const { setShowModal, setExpandedCalendar } = tasksPageSlice.actions

export default tasksPageSlice.reducer
