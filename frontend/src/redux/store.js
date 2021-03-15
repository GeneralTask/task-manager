import { createStore } from 'redux';
import reducer from './reducer';


const initialState = {
    tasks: [],
    task_groups: [],
}



const store = createStore(reducer, initialState,
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__());

export default store;
