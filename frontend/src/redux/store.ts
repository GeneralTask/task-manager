import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import settingsReducer from './settingsSlice'
import tasksPageReducer from './tasksPageSlice'
import { FLUSH, PAUSE, PERSIST, REHYDRATE } from 'redux-persist/es/constants'
import logger from 'redux-logger'

const middlewares = []
if (process.env.NODE_ENV === 'development') {
    middlewares.push(logger)
}

const reducers = combineReducers({
    tasks_page: tasksPageReducer,
    settings_page: settingsReducer,
})
const persistConfig = {
    key: 'root',
    storage
}
const store = configureStore({
    reducer: persistReducer(persistConfig, reducers),
    devTools: true,
    middleware: (getDefaultMiddleware) =>
        [...getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST]
            }
        }), logger]
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export default store
