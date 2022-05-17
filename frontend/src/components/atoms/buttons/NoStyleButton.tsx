import styled from 'styled-components'

const NoStyleButton = styled.button`
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    font-size: inherit;
    color: inherit;
    cursor: pointer;
    outline: none;
    &:focus {
        outline: none;
    }
    &:disabled {
        cursor: default;
    }
`
export default NoStyleButton
