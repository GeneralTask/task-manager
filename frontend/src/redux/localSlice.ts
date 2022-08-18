import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { DEFAULT_VIEW_WIDTH } from '../styles/dimensions'

export interface LocalState {
    dark_mode: boolean,
    dank_mode: boolean,
    calendar_collapsed: boolean,
    task_page_width: number,
    pull_request_page_width: number,
    overview_page_width: number,
}

const initialState: LocalState = localStorage.getItem('localState') ?
    JSON.parse(localStorage.getItem('localState') || '{}') :
    {
        dark_mode: false,
        dank_mode: false,
        calendar_collapsed: false,
        task_page_width: DEFAULT_VIEW_WIDTH,
        pull_request_page_width: DEFAULT_VIEW_WIDTH,
        overview_page_width: DEFAULT_VIEW_WIDTH,
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
        setTaskPageWidth(state, action: PayloadAction<number>) {
            state.task_page_width = action.payload
            localStorage.setItem('localState', JSON.stringify(state))
        },
        setPullRequestPageWidth(state, action: PayloadAction<number>) {
            state.pull_request_page_width = action.payload
            localStorage.setItem('localState', JSON.stringify(state))
        },
        setOverviewPageWidth(state, action: PayloadAction<number>) {
            state.overview_page_width = action.payload
            localStorage.setItem('localState', JSON.stringify(state))
        },

    },
})

export const { setDarkMode, setDankMode, setCalendarCollapsed, setOverviewPageWidth, setPullRequestPageWidth, setTaskPageWidth } = localSlice.actions

export default localSlice.reducer
