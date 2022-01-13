import styled, { keyframes } from 'styled-components'

import { FetchStatusEnum, LogEvents } from '../../helpers/enums'
import React, { useCallback } from 'react'
import { useAppSelector } from '../../redux/hooks'
import { useFetchTasks } from './TasksPage'
import { logEvent } from '../../helpers/utils'

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
`

const RefreshButton = (): JSX.Element => {
    const isLoading = useAppSelector((state) => state.tasks_page.tasks.fetch_status) === FetchStatusEnum.LOADING
    const fetchTasks = useFetchTasks()

    const refresh = useCallback(() => {
        fetchTasks()
        logEvent(LogEvents.MANUAL_TASKS_REFRESH_CLICK)
    }, [])

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
