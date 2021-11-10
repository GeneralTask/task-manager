import { DragState, FetchStatusEnum } from './enums'
import { TFetchStatus, TSetting, TTaskSection } from '../helpers/types'
import { compose, createStore } from 'redux'

import { emptyFunction } from '../helpers/utils'
import reducer from './reducer'

export interface RootState {
    task_sections: TTaskSection[],
    tasks_fetch_status: TFetchStatus,
    tasks_drag_state: DragState,
    expanded_body: string | null,
    settings: TSetting[],
}

export const initialState: RootState = {
    task_sections: [],
    tasks_fetch_status: {
        status: FetchStatusEnum.LOADING,
        abort_fetch: emptyFunction,
    },
    tasks_drag_state: DragState.noDrag,
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
