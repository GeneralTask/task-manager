import styled from 'styled-components'
import { NoSelect, SHADOW_EXPANDED, SHADOW_PRIMARY, TEXT_GRAY } from '../../helpers/styles'

export const MessageContainer = styled.div<{ isExpanded: boolean }>`
    width: 60%;
    min-width: 500px;
    margin: 5px 0;
    padding: 0 10px;
    flex: 0 0 auto;
    font-family: 'Ellipsis', 'Gothic A1', sans-serif;
    border-radius: 12px;
    outline: none;
    background-color: white;
    opacity: 0.8;
    min-height: 50px;
    box-shadow: ${(props) => (props.isExpanded ? SHADOW_EXPANDED : SHADOW_PRIMARY)};
`

export const MessageHeaderContainer = styled(NoSelect) <{ hoverEffect: boolean, showButtons: boolean }>`
    position: relative;
    font-size: 15px;
    border-radius: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: ${props => props.hoverEffect ? 'pointer' : 'inherit'};
    min-height: 50px;
`

export const RelativeDate = styled.span`
    color: ${TEXT_GRAY};
    padding: 2px;
`

export const UnreadIndicator = styled.span`
    color: red;
    background-color: red;
    margin: 0 5px;
    border-radius: 50%;
    width: 5px;
    height: 5px;
`