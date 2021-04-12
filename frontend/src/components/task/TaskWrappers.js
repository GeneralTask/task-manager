import { React, useState, useEffect } from 'react'
import Task from './Task'
const moment = require('moment');

function ScheduledTask(props) {
    return (
        <div className="task-group">
            <div className="task-time-annotation" />
            <div className="task-group-tasks">
                <Task {...props} />
            </div>
            <div className="task-time-annotation">
                <TimeDuration time_duration={props.time_duration} next_time={props.next_time}/>
            </div>
        </div>
    )
}

function UnscheduledTaskGroup(props) {
    return (
        <div className="task-group">
            <div className="task-time-annotation" />
            <div className="task-group-tasks">
                { props.tasks.map((task) =>
                    <Task task={task} key={task.id_ordering} />
                )}
            </div>
            <div className="task-time-annotation unscheduled-time-annotation-container">
                <div className="unscheduled-spanbar"></div>
                <div className="unscheduled-time-spacer"></div>
                <TimeDuration time_duration={props.time_duration} next_time={props.next_time}/>
            </div>
        </div>
    )
}

function TimeDuration(props) {
    const [timeStr, setTimeStr] = useState(props.time_duration);
    useEffect(() => {
        let timer;
        if(props.next_time){
            timer = setInterval(()=>{
                console.log('hehe')
            }, 1000);
        }
        return () => {
            if(timer) clearInterval();
        }
    }, [])
    return(
        <div className="unscheduled-time-annotation">{timeStr}</div>
    )
}

// accepts two moment objects
function getTimeStr(start, end){
    let timeStr = "";
    if (start && end) {
        const diff = moment.duration(end.diff(start));
        const hours = diff.asHours();
        const minutes = (hours % 1) * 60;
        if (hours >= 1) {
            const justHours = Math.floor(hours);
            if (justHours > 1) {
                timeStr += justHours + " hours ";
            }
            else {
                timeStr += justHours + " hour ";
            }
        }
        if (minutes > 0) {
            if (minutes > 1) {
                timeStr += minutes + " mins ";
            }
            else {
                timeStr += minutes + " min ";
            }
        }
    }
    return timeStr;
}

export {
    ScheduledTask,
    UnscheduledTaskGroup,
}
