import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { ModalEnum } from '../utils/enums'

export interface TasksPageState {
    modals: {
        show_modal: ModalEnum
    },
    selected_item_id: string | null,
    expanded_calendar: boolean,
}

const initialState: TasksPageState = {
    modals: {
        show_modal: ModalEnum.NONE,
    },
    selected_item_id: null,
    expanded_calendar: false,
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
        }
    },
})

export const {
    setShowModal,
    setExpandedCalendar,
    setSelectedItemId,
} = tasksPageSlice.actions

export default tasksPageSlice.reducer
