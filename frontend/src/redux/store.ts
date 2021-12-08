import { configureStore } from '@reduxjs/toolkit'
import settingsReducer from './settingsSlice'
import tasksPageReducer from './tasksPageSlice'

export const store = configureStore({
    reducer: {
        tasks_page: tasksPageReducer,
        settings_page: settingsReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: false
    }),
    devTools: true,
})

export type RootState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch

export default store
