import React from 'react'
import { connect, useSelector } from 'react-redux'
import { FetchStatus } from '../../redux/enums'
import './dot-spinner.css'


const TaskStatus = () => {
    let content = "";

    const task_groups = useSelector(state => state.task_groups);
    const tasks_fetch_status = useSelector(state => state.tasks_fetch_status);

    if(task_groups.length > 0){
        switch(tasks_fetch_status){
            case FetchStatus.LOADING:
                content = "";
                break;
            case FetchStatus.SUCCESS:
                content = "";
                break;
            case FetchStatus.ERROR:
                content = "There was an error fetching tasks";
                break;
            default:
                content = "";
        }
    }
    else{
        // no tasks
        switch(tasks_fetch_status){
            case FetchStatus.LOADING:
                content = <div className="loader"></div>
                break;
            case FetchStatus.SUCCESS:
                content = "No Tasks";
                break;
            case FetchStatus.ERROR:
                content = "There was an error fetching tasks";
                break;
            default:
                content = "";
        }
    }

    return(
        <div>
            {content 
                ? <div className="spacer40">
                    {content}
                </div>

                : <div></div>
            }
        </div>
    )
}

export default connect(
    state => ({
        tasks_fetch_status: state.tasks_fetch_status,
        task_groups: state.task_groups,
    })
)(TaskStatus);