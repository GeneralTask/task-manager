import React from 'react'
import { connect, useSelector } from 'react-redux'
import { FetchStatus } from '../../redux/enums'
import './dot-spinner.css'
import { TASK_STATUS_FETCH_ERROR, TASK_STATUS_NO_TASKS } from '../../constants'
import styled from 'styled-components'
import { TTaskSection } from '../../helpers/types'
import { RootState } from '../../redux/store'


const Status = styled.div`
    height: 40px;
    text-align: center;
`

const TaskStatus = () => {
    let content: JSX.Element | null = null

    const task_sections: TTaskSection[] = useSelector((state: RootState) => state.task_sections)
    const tasks_fetch_status: FetchStatus = useSelector((state: RootState) => state.tasks_fetch_status)

    switch (tasks_fetch_status) {
        case FetchStatus.LOADING:
            if (task_sections.length === 0) {
                content = <div className="loader" />
            }
            break

        case FetchStatus.SUCCESS:
            if (task_sections.length === 0) {
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
        task_sections: state.task_sections,
    })
)(TaskStatus)
