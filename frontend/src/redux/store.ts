import { configureStore } from '@reduxjs/toolkit'
import userDataReducer from './userDataSlice'
import tasksPageReducer from './tasksPageSlice'
import localReducer from './localSlice'

export const store = configureStore({
    reducer: {
        tasks_page: tasksPageReducer,
        user_data: userDataReducer,
        local: localReducer,
    },
    devTools: true,
})

export type RootState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch

export default store
