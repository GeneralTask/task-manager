import { React, useState, useEffect } from 'react'
import Task from './Task'
const moment = require('moment');

function ScheduledTask(props) {
    return (
        <div className="task-group">
            <div className="task-time-annotation align-right" >
                {moment(props.datetime_start).format("h:mm a")}
            </div>
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
                { props.tasks.map((task, index) =>
                    <Task task={task} key={task.id_ordering} index={index} />
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
    let initialTimeStr = props.time_duration;
    if(props.next_time){
        initialTimeStr = getTimeStr(moment(), props.next_time);
    }
    const [timeStr, setTimeStr] = useState(initialTimeStr);
    useEffect(() => {
        let timer;
        if(props.next_time){
            timer = setInterval(()=>{
                const time = getTimeStr(moment(), props.next_time);
                setTimeStr(time);
            }, 1000);
        }
        return () => {
            if(timer) clearInterval();
        }
    }, [props.next_time])
    return(
        <div>{timeStr}</div>
    )
}

// accepts two moment objects
function getTimeStr(start, end){
    let timeStr = "";
    if (start && end) {
        const diff = moment.duration(end.diff(start));
        let hours = diff.asHours();
        const minutes = Math.floor((hours % 1) * 60);
        hours = Math.floor(hours);
        if (hours >= 1) {
            hours = Math.floor(hours);
            if (hours > 1) {
                timeStr += hours + " hours ";
            }
            else {
                timeStr += hours + " hour ";
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
        if (hours === 0 && minutes < 1){
            timeStr = "<1 min";
        }
    }
    return timeStr;
}

export {
    ScheduledTask,
    UnscheduledTaskGroup,
}
