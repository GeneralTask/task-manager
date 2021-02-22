import { createStore } from 'redux';
import reducer from './reducer';


const initialState = {
    tasks: []
}



const store = createStore(reducer, initialState);

export default store;