import styled, { css, keyframes } from 'styled-components'
import NoStyleButton from './NoStyleButton'

const spin = keyframes`
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
`
const animation = css`
    animation: ${spin} 1s linear infinite;
`
const RefreshButton = styled(NoStyleButton)<{ isRefreshing?: boolean }>`
    ${(props) => props.isRefreshing && animation}
`

export default RefreshButton
