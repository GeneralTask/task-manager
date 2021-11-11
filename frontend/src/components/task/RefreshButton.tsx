import styled, { css, keyframes } from 'styled-components'

import { FetchStatusEnum } from '../../redux/enums'
import React from 'react'
import { RootState } from '../../redux/store'
import { fetchTasks } from '../../helpers/utils'
import { useSelector } from 'react-redux'

const spin = keyframes`
    from {
        transform: rotate(0deg); 
    }
    to {
        transform: rotate(360deg);
    }
`

const spinRule = css(
    (['', '1s', 'linear', 'infinte'] as any) as TemplateStringsArray,
    spin
)

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
    const isLoading = useSelector((state: RootState) => state.tasks_fetch_status.status) === FetchStatusEnum.LOADING
    return <Container onClick={fetchTasks}>
        {isLoading
            ? <SpinningRefreshBtn src="images/refresh.svg" />
            : <RefreshBtn src="images/refresh.svg" />
        }
    </Container>
}

export default React.memo(RefreshButton)
