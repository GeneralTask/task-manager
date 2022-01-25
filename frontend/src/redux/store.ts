import { configureStore } from '@reduxjs/toolkit'
import userDataReducer from './userDataSlice'
import tasksPageReducer from './tasksPageSlice'
import messagesPageReducer from './messagesPageSlice'

export const store = configureStore({
    reducer: {
        tasks_page: tasksPageReducer,
        messages_page: messagesPageReducer,
        user_data: userDataReducer,
    },
    devTools: true,
})

export type RootState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch

export default store
