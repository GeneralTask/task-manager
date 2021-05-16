import React, { useEffect } from 'react'
import { connect, useSelector } from 'react-redux'
import store from '../../redux/store'
import {removeTask, setTasks, setTasksFetchStatus} from '../../redux/actions'
import { FetchStatus } from '../../redux/enums'
import { TASKS_URL, REACT_APP_FRONTEND_BASE_URL, TASK_GROUP_SCHEDULED_TASK, TASK_GROUP_UNSCHEDULED_GROUP } from '../../constants'
import Cookies from 'js-cookie';
import {ScheduledTask, UnscheduledTaskGroup} from './TaskWrappers'
import TaskStatus from './TaskStatus'
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import moment from 'moment'

function fetchTasks(){
    store.dispatch(setTasksFetchStatus(FetchStatus.LOADING));
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
            store.dispatch(setTasksFetchStatus(FetchStatus.SUCCESS));
            store.dispatch(setTasks(result));
        },
        (error) => {
            store.dispatch(setTasksFetchStatus(FetchStatus.ERROR));
            console.log({error});
        }
    )
}

function TaskList(){

    let task_groups = useSelector(state => state.task_groups);
    let task_counter = 0;

    useEffect(() => {
        setInterval(fetchTasks, 1000 * 60);
        fetchTasks();
    }, []);

    function renderTaskGroup(taskGroup, index){
        let next_time = null;
        if(index === 0 && task_groups.length > 1){
            next_time = moment(task_groups[1].datetime_start);
        }
        if(taskGroup.type === TASK_GROUP_SCHEDULED_TASK){
            if(taskGroup.tasks.length !== 0){
                return <ScheduledTask task={taskGroup.tasks[0]} key={index} time_duration={taskGroup.time_duration} 
                    next_time={!next_time ? null : next_time} datetime_start={taskGroup.datetime_start} index={task_counter++}/>
            }
        }
        else if(taskGroup.type === TASK_GROUP_UNSCHEDULED_GROUP){
            return <UnscheduledTaskGroup tasks={taskGroup.tasks} key={index} time_duration={taskGroup.time_duration} 
                next_time={!next_time ? null : next_time} index={task_counter++}/>
        }
    }

    function onDragEnd(result) {
        const { destination, source } = result;
        
        if (destination === null) return;

        const source_index = source.droppableId.slice(-1);
        const destination_index = destination.droppableId.slice(-1);

        let source_group = task_groups[source_index];
        let dest_group = task_groups[destination_index];
        let source_task = source_group.tasks[source.index];

        source_group.tasks.splice(source.index, 1);
        dest_group.tasks.splice(destination.index, 0, source_task);

        if (source_group.tasks.length === 0) {
            store.dispatch(removeTask(source_index))
        }
    }
    
    return (
        <div>
            <h1 className="spacer40">My Tasks</h1>
            <TaskStatus/>
            <DragDropContext onDragEnd={onDragEnd}>
                { 
                    task_groups.map((group, index) =>
                        <div>
                            <Droppable droppableId={`list-${index}`} isDropDisabled={group.type === TASK_GROUP_SCHEDULED_TASK}>
                                {provided => (
                                    <div ref={provided.innerRef} {...provided.droppableProps}>
                                        {renderTaskGroup(group, index)}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    )
                }
            </DragDropContext>
        </div>
    );
}

export default connect(
    state => ({task_groups: state.task_groups})
)(TaskList);
