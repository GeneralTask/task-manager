import React from 'react'
import { connect, useSelector, dispatch } from 'react-redux'
import Task from './Task'
import store from '../../redux/store'
import {setTasks} from '../../redux/actions'

setTimeout(fetchTasks, 4000);


// will be an API call instead
async function fetchTasks(cb = ()=>{}){
    const tasksResponse = {
        tasks: [
            {
                id: 1, // (str) ID of the task
                id_external: 1, // (str): External ID of the task
                id_ordering: 1, // (int): Integer by which tasks should be ordered in the list
                datetime_end: null, // (str): (when applicable) end timestamp of event
                datetime_start: null, // (str): (when applicable) end timestamp of event
                sender: "Elon Musk", // (str): String to display on the right side of the task
                logo_url: "/slacklogogobrr", // (str): URL of the logo preview to display on the left side of the task
                title: "Omg help me", // (str): String describing main idea of task
            }
        ]
    };

    store.dispatch(setTasks(tasksResponse));

    cb();
}

function TaskList(){

    const tasks = useSelector(state => state.tasks);
    
    return (
        <div>
            { tasks.map(task => 
                <Task/>
            )}
        </div>
    );
}

export default connect(
    state => state.tasks
)(TaskList);