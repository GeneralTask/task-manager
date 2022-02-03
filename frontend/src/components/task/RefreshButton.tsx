import { FetchStatusEnum, LogEvents } from '../../helpers/enums'
import React, { useCallback } from 'react'
import styled, { keyframes } from 'styled-components'

import { logEvent } from '../../helpers/utils'
import { useAppSelector } from '../../redux/hooks'
import { useFetchMessages } from '../messages/MessagesPage'
import { useFetchTasks } from './TasksPage'
import { useKeyboardShortcut } from '../common/KeyboardShortcut'

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
    const fetchTasks = useFetchTasks()
    const fetchMessages = useFetchMessages()

    const refresh = useCallback(() => {
        fetchTasks()
        fetchMessages()
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
