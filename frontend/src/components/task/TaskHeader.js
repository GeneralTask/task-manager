import React from 'react'
import './Task.css'

const TaskHeader = ({icon_url, title, sender}) => {
    return(
        <div className="task-header" >
            <div className="task-header-side flex-expand">
                <img className="domino" src="images/domino.svg" alt=""/>
                <img className="task-icon" src={icon_url} alt="icon"></img>
                <div className="task-header-text">{title}</div>
            </div>
            <div className="task-header-side">
                <div className="task-header-source">
                    {sender}
                </div>
            </div>
        </div>
    )
}

export default TaskHeader;
