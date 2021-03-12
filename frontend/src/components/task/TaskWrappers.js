import {React} from 'react'
import Task from './Task'

function ScheduledTask(props){
    return(
        <Task {...props}/>
    )
}

function NonScheduledTaskBlock(props){
    return(
        <Task {...props}/>
    )
}

export {
    ScheduledTask,
    NonScheduledTaskBlock,
}