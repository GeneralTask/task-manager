import { configureStore } from '@reduxjs/toolkit'
import userDataReducer from './userDataSlice'
import tasksPageReducer from './tasksPageSlice'
import messagesPageReducer from './messagesPageSlice'
import { generalTaskApi } from '../services/generalTaskApi'

export const store = configureStore({
    reducer: {
        [generalTaskApi.reducerPath]: generalTaskApi.reducer,
        tasks_page: tasksPageReducer,
        messages_page: messagesPageReducer,
        user_data: userDataReducer,
    },
    devTools: true,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(generalTaskApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch

export default store
