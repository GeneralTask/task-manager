import { createStore } from 'redux'
import reducer from './reducer'
import { FetchStatus } from './enums'


const initialState = {
    task_groups: [],
    tasks_fetch_status: FetchStatus.LOADING,
    expanded_body: null,
}



const store = createStore(reducer, initialState,
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__())

export default store
