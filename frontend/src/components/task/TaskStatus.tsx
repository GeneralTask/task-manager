import React from 'react'
import { connect, useSelector } from 'react-redux'
import { FetchStatus } from '../../redux/enums'
import './dot-spinner.css'
import { TASK_STATUS_FETCH_ERROR, TASK_STATUS_NO_TASKS } from '../../constants'
import styled from 'styled-components'
import { TTaskGroup } from '../../helpers/types'
import { RootState } from '../../redux/store'


const Status = styled.div`
    height: 40px;
    text-align: center;
`

const TaskStatus = () => {
    let content: JSX.Element | null = null

    const task_groups: TTaskGroup[] = useSelector((state: RootState) => state.task_groups)
    const tasks_fetch_status: FetchStatus = useSelector((state: RootState) => state.tasks_fetch_status)

    switch (tasks_fetch_status) {
        case FetchStatus.LOADING:
            if (task_groups.length === 0) {
                content = <div className="loader" />
            }
            break

        case FetchStatus.SUCCESS:
            if (task_groups.length === 0) {
                content = <div>{TASK_STATUS_NO_TASKS}</div>
            }
            break

        case FetchStatus.ERROR:
            content = <div>{TASK_STATUS_FETCH_ERROR}</div>
            break

        default:
            content = null
    }

    return (
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
    (state: RootState) => ({
        tasks_fetch_status: state.tasks_fetch_status,
        task_groups: state.task_groups,
    })
)(TaskStatus)
