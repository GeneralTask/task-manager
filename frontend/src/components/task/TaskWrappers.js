import { React, useState, useEffect } from 'react'
import Task from './Task'
const moment = require('moment');

const ScheduledTask = ({datetime_start, time_duration, next_time, ...rest}) => 
    <div className="task-group">
        <div className="task-time-annotation align-right" >
            {moment(datetime_start).format("h:mm a")}
        </div>
        <div className="task-group-tasks">
            <Task 
                datetime_start={datetime_start} 
                time_duration={time_duration} 
                next_time={next_time}
                {...rest}
            />
        </div>
        <div className="task-time-annotation">
            <TimeDuration time_duration={time_duration} next_time={next_time}/>
        </div>
    </div>

const UnscheduledTaskGroup = ({tasks, time_duration, next_time}) =>
    <div className="task-group">
        <div className="task-time-annotation" />
        <div className="task-group-tasks">
            { tasks.map((task, index) =>
                <Task task={task} key={task.id_ordering} index={index} />
            )}
        </div>
        <div className="task-time-annotation unscheduled-time-annotation-container">
            <div className="unscheduled-spanbar"></div>
            <div className="unscheduled-time-spacer"></div>
            <TimeDuration time_duration={time_duration} next_time={next_time}/>
        </div>
    </div>

const TimeDuration = ({time_duration, next_time}) => {
    let initialTimeStr = time_duration;
    if(next_time){ // if this is the first task group (live updates)
        initialTimeStr = getLiveTimeStr(next_time);
    }
    else{ // this is not the first task - time is formatted based off of task group duration in seconds
        initialTimeStr = getTimeStr(moment.duration(time_duration * 1000));
    }
    const [timeStr, setTimeStr] = useState(initialTimeStr);
    useEffect(() => {
        let timer;
        if(next_time){
            timer = setInterval(()=>{
                setTimeStr(getLiveTimeStr(next_time));
            }, 1000);
        }
        return () => {
            if(timer) clearInterval();
        }
    }, [next_time])
    return(
        <div>{timeStr}</div>
    )
}

const getTimeStr = (duration) => {
    let timeStr = "";
    let hours = duration.asHours();
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
    return timeStr;
}

const getLiveTimeStr = (next_time) => 
    getTimeStr(moment.duration(next_time.diff(moment())));

export {
    ScheduledTask,
    UnscheduledTaskGroup,
}
