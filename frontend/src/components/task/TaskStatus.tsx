import { TASK_STATUS_FETCH_ERROR, TASK_STATUS_NO_TASKS } from '../../constants'

import DotSpinner from '../common/DotSpinner'
import { FetchStatusEnum } from '../../redux/enums'
import React from 'react'
import { RootState } from '../../redux/store'
import styled from 'styled-components'
import { useSelector } from 'react-redux'

const Status = styled.div`
    height: 40px;
    text-align: center;
`

export default function TaskStatus(): JSX.Element {
    let content: JSX.Element | null = null

    const { taskSections, fetchStatus } = useSelector((state: RootState) => ({
        taskSections: state.tasks_page.task_sections,
        fetchStatus: state.tasks_page.tasks_fetch_status.status,
    }))

    switch (fetchStatus) {
        case FetchStatusEnum.LOADING:
            if (taskSections.length === 0) {
                content = <DotSpinner />
            }
            break

        case FetchStatusEnum.SUCCESS:
            if (taskSections.length === 0) {
                content = <div>{TASK_STATUS_NO_TASKS}</div>
            }
            break

        case FetchStatusEnum.ERROR:
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
