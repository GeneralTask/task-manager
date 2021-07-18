import { compose, createStore } from 'redux'
import reducer from './reducer'
import { FetchStatus } from './enums'
import { TSetting, TTaskSection } from '../helpers/types'

export interface RootState {
    task_sections: TTaskSection[],
    tasks_fetch_status: FetchStatus,
    expanded_body: string | null,
    settings: TSetting[],
}

const initialState: RootState = {
    task_sections: [],
    tasks_fetch_status: FetchStatus.LOADING,
    expanded_body: null,
    settings: [],
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
