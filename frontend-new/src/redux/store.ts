import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit'
import userDataReducer from './userDataSlice'
import tasksPageReducer from './tasksPageSlice'
import messagesPageReducer from './messagesPageSlice'
import { tasksApi } from '../services/tasks'

export const store = configureStore({
    reducer: {
        [tasksApi.reducerPath]: tasksApi.reducer,
        tasks_page: tasksPageReducer,
        messages_page: messagesPageReducer,
        user_data: userDataReducer,
    },
    devTools: true,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(tasksApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch

export default store
