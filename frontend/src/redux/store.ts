import { configureStore } from '@reduxjs/toolkit'
import settingsReducer from './settingsSlice'
import tasksPageReducer from './tasksPageSlice'
import messagesPageReducer from './messagesPageSlice'

export const store = configureStore({
    reducer: {
        tasks_page: tasksPageReducer,
        settings_page: settingsReducer,
        messages_page: messagesPageReducer,
    },
    devTools: true,
})

export type RootState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch

export default store
