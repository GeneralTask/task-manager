import { compose, createStore } from 'redux'
import reducer from './reducer'
import { FetchStatus } from './enums'
import { TTaskGroup } from '../helpers/types'

export interface RootState {
    task_groups: TTaskGroup[],
    tasks_fetch_status: FetchStatus,
    expanded_body: string | null,
}

const initialState: RootState = {
    task_groups: [],
    tasks_fetch_status: FetchStatus.LOADING,
    expanded_body: null,
}

declare global {
    interface Window {
        __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
    }
}
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

const store = createStore(reducer, initialState,
    composeEnhancers())

export type AppDispatch = typeof store.dispatch

export default store
