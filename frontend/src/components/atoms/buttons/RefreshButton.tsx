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

const RefreshButton = styled.button<{ isRefreshing?: boolean }>`
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    font-size: inherit;
    color: inherit;
    cursor: pointer;
    outline: none;
    ${(props) => props.isRefreshing && animation}
    &:focus {
        outline: none;
    }
`

export default RefreshButton
