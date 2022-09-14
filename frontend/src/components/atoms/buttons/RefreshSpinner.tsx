import styled, { css, keyframes } from 'styled-components'

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
const RefreshSpinner = styled.div<{ isRefreshing?: boolean }>`
    ${(props) => props.isRefreshing && animation}
`

export default RefreshSpinner
