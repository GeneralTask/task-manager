import {React, useEffect} from 'react'
import { connect, useSelector } from 'react-redux'
import store from '../../redux/store'
import {setTasks} from '../../redux/actions'
import { TASKS_URL, REACT_APP_FRONTEND_BASE_URL } from '../../constants'
import Cookies from 'js-cookie';
import {ScheduledTask} from './TaskWrappers'

function fetchTasks(){
    fetch(TASKS_URL, {
        mode: 'cors',
        headers: {
            'Authorization': 'Bearer ' + Cookies.get('authToken'),
            'Access-Control-Allow-Origin': REACT_APP_FRONTEND_BASE_URL,
            'Access-Control-Allow-Headers': 'access-control-allow-origin, access-control-allow-headers',
        }
    })
    .then((res) => {
        if(!res.ok){
            return Promise.reject('/tasks api call failed');
        }
        const resj = res.json();
        return resj;
    })
    .then(
        (result) => {
            store.dispatch(setTasks(result.tasks, result.task_groups));
        },
        (error) => {
            console.log({error});
        }
    )
}

function TaskList(){

    useEffect(() => {
        fetchTasks();
    }, [])

    const tasks = useSelector(state => state.tasks);
    
    return (
        <div>
            <h1 className="spacer40">My Tasks</h1>

            {tasks.length === 0  && 
                <h2 className="spacer40">No Tasks :(</h2>
            }
            { tasks.map((task, index) => 
                <ScheduledTask task={task} key={index}/>
            )}
        </div>
    );
}

export default connect(
    state => ({tasks: state.tasks})
)(TaskList);
