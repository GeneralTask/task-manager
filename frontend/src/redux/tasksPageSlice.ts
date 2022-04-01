import { PayloadAction, createSlice } from '@reduxjs/toolkit'

import { ModalEnum } from '../utils/enums'

export interface TasksPageState {
    modals: {
        show_modal: ModalEnum
    },
    selected_item_id: string | null,
}

const initialState: TasksPageState = {
    modals: {
        show_modal: ModalEnum.NONE,
    },
    selected_item_id: null,
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
    },
})

export const {
    setShowModal,
    setSelectedItemId,
} = tasksPageSlice.actions

export default tasksPageSlice.reducer
