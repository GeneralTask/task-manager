import { configureStore } from '@reduxjs/toolkit'
import tasksPageReducer from './tasksPageSlice'
import userDataReducer from './userDataSlice'

export const store = configureStore({
    reducer: {
        tasks_page: tasksPageReducer,
        user_data: userDataReducer,
    },
    devTools: true,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware(),
})

export type RootState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch

export default store
