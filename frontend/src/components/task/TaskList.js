import React, { useEffect} from 'react'
import { connect, useSelector } from 'react-redux'
import store from '../../redux/store'
import {setTasks} from '../../redux/actions'
import { TASKS_URL, REACT_APP_FRONTEND_BASE_URL, TASK_GROUP_SCHEDULED_TASK, TASK_GROUP_UNSCHEDULED_GROUP } from '../../constants'
import Cookies from 'js-cookie';
import {ScheduledTask, UnscheduledTaskGroup} from './TaskWrappers'
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

import { useState } from "react";
//Remove Start
const grid = 8;

const initial = Array.from({ length: 10 }, (v, k) => k).map(k => {
    const custom = {
      id: `id-${k}`,
      content: `Quote ${k}`
    };
  
    return custom;
  });



function Quote({ quote, index }) {
  return (
    <Draggable draggableId={quote.id} index={index}>
      {provided => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          {quote.content}
        </div>
      )}
    </Draggable>
  );
}

function TempTask({ task, index }) {
    return (
      <Draggable draggableId={task.id} index={index}>
        {provided => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
          >
            {task.title}
          </div>
        )}
      </Draggable>
    );
  }

const NewTaskList = React.memo(function NewTaskList({ tasks }) {
    return tasks.map((task, index) => (
      <TempTask task={task} index={index} key={task.id} />
    ));
  });
  
//Remove End

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

    const [state, setState] = useState({ quotes: initial });


    const tasks = useSelector(state => state.tasks);
    const task_groups = useSelector(state => state.task_groups);
    const id_to_index = new Map(tasks.map((task, index) => [task.id, index]));

    function renderTaskGroup(taskGroup, index){
        if(taskGroup.type === TASK_GROUP_SCHEDULED_TASK){
            if(taskGroup.task_ids.length !== 0){
                const scheduledTask = tasks[id_to_index.get(taskGroup.task_ids[0])];
                return <ScheduledTask task={scheduledTask} key={index} time_duration={taskGroup.time_duration} />
            }
        }
        else if(taskGroup.type === TASK_GROUP_UNSCHEDULED_GROUP){
            const tasksSplice = taskGroup.task_ids.map(taskId => tasks[id_to_index.get(taskId)]);
            return <UnscheduledTaskGroup tasks={tasksSplice} key={index} time_duration={taskGroup.time_duration} />
        }
    }

    function getGroupTasks(groupIndex) {
        let group = task_groups[groupIndex]
        return group.task_ids.map(taskId => tasks[id_to_index.get(taskId)]);
    }

    function onDragEnd(result) {
        // TO-DO
        console.log(tasks)
    }
    
    return (
        <div>
            <h1 className="spacer40">My Tasks</h1>

            {tasks.length === 0  && 
                <h2 className="spacer40">No Tasks :(</h2>
            }
            <DragDropContext>
                { 
                    task_groups.map((group, index) =>
                        <div>
                            <Droppable droppableId={`list-${index}`}>
                                {provided => (
                                    <div ref={provided.innerRef} {...provided.droppableProps}>
                                        <NewTaskList tasks={getGroupTasks(index)} />
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                            End
                        </div>
                    )
                }
            </DragDropContext>
        </div>
    );
}

export default connect(
    state => ({tasks: state.tasks})
)(TaskList);
