import React from 'react'
import { connect, useSelector } from 'react-redux'
import Task from './Task'
import store from '../../redux/store'
import {setTasks, addTask, removeTask} from '../../redux/actions'
import { TASKSURL } from '../../constants'

setTimeout(fetchTasks, 1000);

const sampleTask = {
    id: 1, // (str) ID of the task
    id_external: 1, // (str): External ID of the task
    id_ordering: 1, // (int): Integer by which tasks should be ordered in the list
    datetime_end: null, // (str): (when applicable) end timestamp of event
    datetime_start: null, // (str): (when applicable) end timestamp of event
    sender: "@hackerdog", // (str): String to display on the right side of the task
    logo_url: "images/slack-logo-icon.png", // (str): URL of the logo preview to display on the left side of the task
    title: "Hey, can you help me put out this fire"
};

// will be an API call instead
function fetchDummyTasks(cb = ()=>{}){
    const tasksResponse = {
        tasks: [
            sampleTask,
            {
                ...sampleTask,
                id: 2,
                id_ordering: 2,
                logo_url: "images/Gmail-logo-500x377.png",
                title: "General Task Meeting",
            }
        ]
    };

    store.dispatch(setTasks(tasksResponse.tasks));

    cb();
}

function fetchTasks(){
    fetch(TASKSURL)
    .then((res) => {
        console.log({res});
        const resj = res.json();
        console.log({resj});
        return resj;
    })
    .then(
        (result) => {
            console.log({result});
        },
        (error) => {
            console.log({error});
            fetchDummyTasks();
        }
    )
}

function TaskList(){

    const tasks = useSelector(state => state.tasks);
    
    return (
        <div>
            <h1 className="spacer40">My Tasks</h1>

            {tasks.length === 0  && 
                <h2 className="spacer40">No Tasks :(</h2>
            }
            { tasks.map((task) => 
                <Task task={task} key={task.id_ordering} />
            )}


            <button onClick={
                () => store.dispatch(addTask({
                    ...sampleTask,
                    id_ordering: tasks[tasks.length - 1].id_ordering + 1,
                    id: tasks[tasks.length - 1].id + 1
                }))
            }>Add Task</button>
            <button onClick={
                () => store.dispatch(removeTask(tasks[tasks.length - 1].id_ordering))
            }>Remove Task</button>
        </div>
    );
}

export default connect(
    state => ({tasks: state.tasks})
)(TaskList);
