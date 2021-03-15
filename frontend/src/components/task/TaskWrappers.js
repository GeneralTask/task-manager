import { React } from 'react'
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
                {getTimeStr(props.task.datetime_start, props.task.datetime_end)}
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
            <div className="task-time-annotation">
                I am Groop
            </div>
        </div>
    )
}

function getTimeStr(datetime1, datetime2){
    let timeStr = "";
    if (datetime1 && datetime2) {
        const start = moment(datetime1);
        const end = moment(datetime2);
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
