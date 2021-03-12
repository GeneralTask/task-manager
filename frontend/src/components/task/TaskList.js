import {React, useEffect} from 'react'
import { connect, useSelector } from 'react-redux'
import {ScheduledTask, NonScheduledTaskBlock} from './TaskWrappers'
import store from '../../redux/store'
import {setTasks} from '../../redux/actions'
import { TASKS_URL, REACT_APP_FRONTEND_BASE_URL } from '../../constants'
import Cookies from 'js-cookie'

const scheduledTaskypes = ['gcal']

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
            store.dispatch(setTasks(result));
        },
        (error) => {
            console.log({error});
        }
    )
}

function groupTasks(tasks) {
    let inNonScheduledBlock = false; // if the previous task was not a calendar event
    let isScheduledTask; // if the current task is a scheduled (calendar) event
    const groupedTasks = [];
    for (const task of tasks) {
        isScheduledTask = scheduledTaskypes.includes(task.source);
        if (inNonScheduledBlock && !isScheduledTask) { // currently in a non-calendar block 
            groupedTasks[groupedTasks.length - 1].tasks.push(task);
        }
        else if (isScheduledTask) {  // is a scheduled event (e.g. gcal meeting)
            inNonScheduledBlock = false;
            groupedTasks.push({
                isScheduledTask: true,
                task
            })
        }
        else { // not a scheduled event (e.g. email or slack)
            inNonScheduledBlock = true;
            groupedTasks.push({
                isScheduledTask: false,
                tasks: [task]
            })
        }
    }
    return groupedTasks;
}

function TaskList() {

    useEffect(() => {
        fetchTasks();
    }, [])

    const tasks = useSelector(state => state.tasks);
    const groupedTasks = groupTasks(tasks);
    return (
        <div>
            <h1 className="spacer40">My Tasks</h1>

            {tasks.length === 0 &&
                <h2 className="spacer40">No Tasks :(</h2>
            }
            { tasks.map((task) =>
                task.isScheduledTask
                    ? <ScheduledTask task={task} key={task.id_ordering} />
                    : <NonScheduledTaskBlock task={task} key={task.id_ordering} />
            )}
        </div>
    );
}

export default connect(
    state => ({tasks: state.tasks})
)(TaskList);
