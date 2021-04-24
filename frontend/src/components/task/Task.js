import React from 'react'
import './Task.css'
import TaskHeader from './TaskHeader'

export default function Task(props){
    return(
        <div className={"task-container " + (props.task.deeplink ? "deeplink" : "")}
            onClick={() => { if (props.task.deeplink) { window.open(props.task.deeplink) } }} >
            <TaskHeader
                title={props.task.title} 
                icon_url={props.task.logo_url} 
                sender={props.task.sender} 
            />
        </div>
    )
}
