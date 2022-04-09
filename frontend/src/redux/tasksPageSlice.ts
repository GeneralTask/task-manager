import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ModalEnum } from '../utils/enums'

export interface TasksPageState {
    modals: {
        show_modal: ModalEnum
    },
    selected_item_id: string | null,
    expanded_calendar: boolean,
    enable_auto_refresh: boolean,
}

const initialState: TasksPageState = {
    modals: {
        show_modal: ModalEnum.NONE,
    },
    selected_item_id: null,
    expanded_calendar: false,
    enable_auto_refresh: true,
}

export const tasksPageSlice = createSlice({
    name: 'tasks_page',
    initialState,
    reducers: {
        setShowModal(state, action: PayloadAction<ModalEnum>) {
            state.modals.show_modal = action.payload
        },
        setSelectedItemId(state, action: PayloadAction<string | null>) {
            state.selected_item_id = action.payload
        },
        setExpandedCalendar(state, action: PayloadAction<boolean>) {
            state.expanded_calendar = action.payload
        },
        setEnableAutoRefresh(state, action: PayloadAction<boolean>) {
            state.enable_auto_refresh = action.payload
        },
    },
})

export const {
    setShowModal,
    setExpandedCalendar,
    setSelectedItemId,
    setEnableAutoRefresh,
} = tasksPageSlice.actions

export default tasksPageSlice.reducer
