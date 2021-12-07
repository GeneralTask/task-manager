import styled, { keyframes } from 'styled-components'

import { FetchStatusEnum } from '../../redux/enums'
import React from 'react'
import { useAppSelector } from '../../redux/hooks'
import { useFetchTasks } from '../../helpers/utils'

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
    const isLoading = useAppSelector(
        state => state.tasks_page.tasks_fetch_status.status
    ) === FetchStatusEnum.LOADING
    const fetchTasks = useFetchTasks()
    return <Container onClick={fetchTasks}>
        {isLoading
            ? <SpinningRefreshBtn src="images/refresh.svg" />
            : <RefreshBtn src="images/refresh.svg" />
        }
    </Container>
}

export default React.memo(RefreshButton)
