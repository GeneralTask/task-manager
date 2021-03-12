import {React} from 'react'
import Task from './Task'

function ScheduledTask(props){
    return(
        <Task {...props}/>
    )
}

function NonScheduledTaskBlock(props){
    return(
        <div>
            { props.tasks.map((task) => 
                <Task task={task} key={task.id_ordering} />
            )}
        </div>
    )
}

export {
    ScheduledTask,
    NonScheduledTaskBlock,
}
