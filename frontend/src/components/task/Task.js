import React from 'react'
import './Task.css'
import TaskHeader from './TaskHeader'
import { Draggable } from "react-beautiful-dnd";

const Task = ({task, index, isDragDisabled}) => {
    return (
        <Draggable draggableId={task.id} index={index} isDragDisabled={isDragDisabled}>
          {provided => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
            >
                <div className={"task-container " + (task.deeplink ? "deeplink" : "")}
                    onClick={() => { if (task.deeplink) { window.open(task.deeplink) } }} >
                    <TaskHeader
                        title={task.title} 
                        icon_url={task.logo_url} 
                        sender={task.sender} 
                        provided={provided}
                    />
                </div>     
            </div>
          )}
        </Draggable>
      );
}

export default Task;
