import styled from 'styled-components'
import { SHADOW_EXPANDED, SHADOW_PRIMARY, TEXT_GRAY } from '../../helpers/styles'

export const MessageContainer = styled.div<{ isExpanded: boolean }>`
    width: 60%;
    min-width: 500px;
    margin: 5px 0;
    padding: 0;
    flex: 0 0 auto;
    font-family: 'Ellipsis', 'Gothic A1', sans-serif;
    border-radius: 12px;
    outline: none;
    background-color: white;
    opacity: 0.8;
    min-height: 50px;
    box-shadow: ${(props) => (props.isExpanded ? SHADOW_EXPANDED : SHADOW_PRIMARY)};
`
export const RelativeDate = styled.span`
    color: ${TEXT_GRAY};
    padding: 2px;
    margin-right: 10px;
`
export const UnreadIndicator = styled.span`
    color: red;
    background-color: red;
    margin-left: 14px;
    border-radius: 50%;
    flex-shrink: 0;
    width: 7px;
    height: 7px;
`
export const Icon = styled.img`
    max-width: 19px;
    margin-left: 14px;
`
