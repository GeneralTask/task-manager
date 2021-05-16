import React from 'react'
import './Task.css'
import TaskHeader from './TaskHeader'
import { Draggable } from "react-beautiful-dnd";

export default function Task(props){
    return (
        <Draggable draggableId={props.task.id} index={props.index} isDragDisabled={props.isDragDisabled}>
          {provided => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
            >
                <div className={"task-container " + (props.task.deeplink ? "deeplink" : "")}
                    onClick={() => { if (props.task.deeplink) { window.open(props.task.deeplink) } }} >
                    <TaskHeader
                        title={props.task.title} 
                        icon_url={props.task.logo_url} 
                        sender={props.task.sender} 
                        provided={provided}
                    />
                </div>     
            </div>
          )}
        </Draggable>
      );
}
