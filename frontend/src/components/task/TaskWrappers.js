import { React } from 'react'
import Task from './Task'
const moment = require('moment');

function ScheduledTask(props) {
    const timeStr = getTimeStr(props.task.datetime_start, props.task.datetime_end);
    console.log({timeStr})
    return (
        <div className="scheduled-task">
            <div className="task-time-annotation" />
            <Task {...props} />
            <div className="task-time-annotation">
                {timeStr}
            </div>
        </div>
    )
}

function NonScheduledTaskBlock(props) {
    return (
        <div>
            { props.tasks.map((task) =>
                <Task task={task} key={task.id_ordering} />
            )}
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
    NonScheduledTaskBlock,
}
