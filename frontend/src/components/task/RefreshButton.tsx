import { FetchStatusEnum, LogEvents } from '../../helpers/enums'
import React, { useCallback } from 'react'
import styled, { keyframes } from 'styled-components'

import { logEvent } from '../../helpers/utils'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { fetchMessagesExternal, useGetMessages } from '../messages/MessagesPage'
import { fetchTasksExternal, useGetTasks } from './TasksPage'
import { useKeyboardShortcut } from '../common/KeyboardShortcut'
import { setTasksFetchStatus } from '../../redux/tasksPageSlice'

const spin = keyframes`
    from {
        transform: rotate(0deg); 
    }
    to {
        transform: rotate(360deg);
    }
`
const RefreshBtn = styled.img`
    width: 30px;
    margin-left: 10px;
`
const SpinningRefreshBtn = styled(RefreshBtn)`
    animation: ${spin} 1s linear infinite;
`
const Container = styled.div`
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
`

const RefreshButton = (): JSX.Element => {
    const isLoading = useAppSelector((state) => state.tasks_page.tasks.fetch_status) === FetchStatusEnum.LOADING
    const getTasks = useGetTasks()
    const getMessages = useGetMessages()

    const dispatch = useAppDispatch()

    const refresh = useCallback(async () => {
        dispatch(setTasksFetchStatus(FetchStatusEnum.LOADING))
        fetchTasksExternal().then(getTasks)
        fetchMessagesExternal().then(getMessages)
        logEvent(LogEvents.MANUAL_TASKS_REFRESH_CLICK)
    }, [])

    useKeyboardShortcut('r', refresh)

    return (
        <Container onClick={refresh}>
            {isLoading ? (
                <SpinningRefreshBtn src={`${process.env.PUBLIC_URL}/images/refresh.svg`} />
            ) : (
                <RefreshBtn src={`${process.env.PUBLIC_URL}/images/refresh.svg`} />
            )}
        </Container>
    )
}

export default React.memo(RefreshButton)
