import {React, useEffect} from 'react'
import { connect, useSelector } from 'react-redux'
import store from '../../redux/store'
import {setTasks} from '../../redux/actions'
import { TASKS_URL, REACT_APP_FRONTEND_BASE_URL, TASK_GROUP_SCHEDULED_TASK, TASK_GROUP_UNSCHEDULED_GROUP } from '../../constants'
import Cookies from 'js-cookie';
import {ScheduledTask, UnscheduledTaskGroup} from './TaskWrappers'
import moment from 'moment'

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

function TaskList(){

    useEffect(() => {
        fetchTasks();
    }, []);

    const task_groups = useSelector(state => state.task_groups);

    function renderTaskGroup(taskGroup, index){
        let next_time = null;
        if(index === 0 && task_groups.length > 1){
            next_time = moment(task_groups[1].datetime_start);
        }
        if(taskGroup.type === TASK_GROUP_SCHEDULED_TASK){
            if(taskGroup.tasks.length !== 0){
                return <ScheduledTask task={taskGroup.tasks[0]} key={index} time_duration={taskGroup.time_duration} 
                    next_time={!next_time ? null : next_time}/>
            }
        }
        else if(taskGroup.type === TASK_GROUP_UNSCHEDULED_GROUP){
            return <UnscheduledTaskGroup tasks={taskGroup.tasks} key={index} time_duration={taskGroup.time_duration} 
                next_time={!next_time ? null : next_time}/>
        }
    }
    
    return (
        <div>
            <h1 className="spacer40">My Tasks</h1>

            {task_groups.length === 0  && 
                <h2 className="spacer40">No Tasks :(</h2>
            }
            { task_groups.map(renderTaskGroup) }
        </div>
    );
}

export default connect(
    state => ({tasks: state.tasks})
)(TaskList);
