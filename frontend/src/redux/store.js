import { createStore } from 'redux';
import reducer from './reducer';


const initialState = {
    tasks: [],
    group_tasks: [],
}



const store = createStore(reducer, initialState,
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__());

export default store;
