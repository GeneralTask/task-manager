import { TASK_STATUS_FETCH_ERROR, TASK_STATUS_NO_TASKS } from '../../constants'
import { connect, useSelector } from 'react-redux'

import { FetchStatus } from '../../redux/enums'
import React from 'react'
import { RootState } from '../../redux/store'
import { TTaskSection } from '../../helpers/types'
import styled from 'styled-components'
import DotSpinner from '../common/DotSpinner'

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
                content = <DotSpinner />
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
        <>
            {content && <Status>{content}</Status>}
        </>
    )
}

export default connect(
    (state: RootState) => ({
        tasks_fetch_status: state.tasks_fetch_status,
        task_sections: state.task_sections,
    })
)(TaskStatus)
