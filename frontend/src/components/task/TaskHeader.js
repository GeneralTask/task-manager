import React from 'react'
import './Task.css'

export default function TaskHeader(props){
    return(
        <div className="task-header" >
            <div className="task-header-side">
                <img className="domino" src="images/domino.svg" alt="" />
                <img className="task-icon" src={props.icon_url} alt="icon"></img>
                <div>{props.title}</div>
            </div>
            <div className="task-header-side">
                <div className="task-header-source">
                    {props.sender}
                </div>
            </div>
        </div>
    )
}