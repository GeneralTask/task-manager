import React from 'react'
import { connect, useSelector } from 'react-redux'
import { FetchStatus } from '../../redux/enums'
import './dot-spinner.css'
import {TASK_STATUS_FETCH_ERROR, TASK_STATUS_NO_TASKS} from '../../constants'
import styled from 'styled-components'

const Status = styled.div`
    height: 40px;
    text-align: center;
`


const TaskStatus = () => {
    let content = null

    const task_groups = useSelector(state => state.task_groups)
    const tasks_fetch_status = useSelector(state => state.tasks_fetch_status)

    switch(tasks_fetch_status){
        case FetchStatus.LOADING:
            if(task_groups.length === 0){
                content = <div className="loader"></div>
            }
            break

        case FetchStatus.SUCCESS:
            if(task_groups.length === 0){
                content = TASK_STATUS_NO_TASKS
            }
            break

        case FetchStatus.ERROR:
            content = TASK_STATUS_FETCH_ERROR
            break

        default:
            content = null
    }

    return(
        <div>
            {content 
                ? <Status>
                    {content}
                </Status>

                : null
            }
        </div>
    )
}

export default connect(
    state => ({
        tasks_fetch_status: state.tasks_fetch_status,
        task_groups: state.task_groups,
    })
)(TaskStatus)
