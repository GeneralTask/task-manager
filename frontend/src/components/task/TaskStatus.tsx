import { TASK_STATUS_FETCH_ERROR, TASK_STATUS_NO_TASKS } from '../../constants'

import DotSpinner from '../common/DotSpinner'
import { FetchStatusEnum } from '../../redux/enums'
import React from 'react'
import styled from 'styled-components'
import { useAppSelector } from '../../redux/hooks'

const Status = styled.div`
    height: 40px;
    text-align: center;
`

export default function TaskStatus(): JSX.Element {
    let content: JSX.Element | null = null

    const { isTaskSectionsEmpty, fetchStatus } = useAppSelector(state => ({
        isTaskSectionsEmpty: state.tasks_page.tasks.task_sections.length === 0,
        fetchStatus: state.tasks_page.tasks.fetch_status,
    }))

    switch (fetchStatus) {
        case FetchStatusEnum.LOADING:
            if (isTaskSectionsEmpty) {
                content = <DotSpinner />
            }
            break

        case FetchStatusEnum.SUCCESS:
            if (isTaskSectionsEmpty) {
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
