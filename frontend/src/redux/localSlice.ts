import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface LocalState {
    dark_mode: boolean,
    dank_mode: boolean,
    calendar_collapsed: boolean,
}

const initialState: LocalState = localStorage.getItem('localState') ?
    JSON.parse(localStorage.getItem('localState') || '{}') :
    {
        dark_mode: false,
        dank_mode: false,
        calendar_collapsed: false,
    }

export const localSlice = createSlice({
    name: 'local',
    initialState,
    reducers: {
        setDarkMode(state, action: PayloadAction<boolean>) {
            state.dark_mode = action.payload
            localStorage.setItem('localState', JSON.stringify(state))
        },
        setDankMode(state, action: PayloadAction<boolean>) {
            state.dank_mode = action.payload
            localStorage.setItem('localState', JSON.stringify(state))
        },
        setCalendarCollapsed(state, action: PayloadAction<boolean>) {
            state.calendar_collapsed = action.payload
            localStorage.setItem('localState', JSON.stringify(state))
        },

    },
})

export const { setDarkMode, setDankMode, setCalendarCollapsed } = localSlice.actions

export default localSlice.reducer
