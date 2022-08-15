import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface TasksPageState {
    expanded_calendar: boolean
}

const initialState: TasksPageState = {
    expanded_calendar: false,
}

export const tasksPageSlice = createSlice({
    name: 'tasks_page',
    initialState,
    reducers: {
        setExpandedCalendar(state, action: PayloadAction<boolean>) {
            state.expanded_calendar = action.payload
        },
    },
})

export const { setExpandedCalendar } = tasksPageSlice.actions

export default tasksPageSlice.reducer
