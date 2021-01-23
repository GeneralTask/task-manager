import React from 'react';
import Task from './Task.js';
import { Droppable } from 'react-beautiful-dnd'

function TaskContainer(props) {
    return (
        <div>
            <h1>{props.column.title}</h1>
            <Droppable droppableId={props.column.id}>
                {provided => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                        {Object.entries(props.tasks).map(([key, task]) => {
                            return <Task key={task.id} task={task} index={key}></Task>
                        })}
                    </div>
                )}
            </Droppable>
        </div>
    )
}

export default TaskContainer;