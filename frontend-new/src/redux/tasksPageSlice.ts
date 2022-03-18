import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { ModalEnum } from '../utils/enums'

export interface TasksPageState {
    modals: {
        show_modal: ModalEnum
    }
}

const initialState: TasksPageState = {
    modals: {
        show_modal: ModalEnum.NONE,
    }
}

export const tasksPageSlice = createSlice({
    name: 'tasks_page',
    initialState,
    reducers: {
        setShowModal(state, action: PayloadAction<ModalEnum>) {
            state.modals.show_modal = action.payload
        },
    },
})

export const {
    setShowModal,
} = tasksPageSlice.actions

export default tasksPageSlice.reducer
