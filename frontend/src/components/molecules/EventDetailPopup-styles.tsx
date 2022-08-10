import { Border, Colors, Spacing, Typography, Shadows } from '../../styles'
import NoStyleButton from '../atoms/buttons/NoStyleButton'
import styled from 'styled-components'
import NoStyleAnchor from '../atoms/NoStyleAnchor'

const MAX_POPUP_LENGTH = '315px'
const WINDOW_HEIGHT = window.innerHeight

interface EventBoxStyleProps {
    xCoord: number
    yCoord: number
    popupHeight: number
    eventHeight: number
}
/* Calculates the position of the popup depending on the position of the event
Handles edge cases for events below max height (window height - popup height) */
export const EventBoxStyle = styled.div<EventBoxStyleProps>`
    position: absolute;
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    padding: ${Spacing.padding._16} 0px;
    width: ${MAX_POPUP_LENGTH};

    left: calc(${(props) => props.xCoord}px - ${MAX_POPUP_LENGTH});
    top: ${(props) =>
        props.yCoord >= WINDOW_HEIGHT - props.popupHeight
            ? props.yCoord - props.eventHeight - props.popupHeight
            : props.yCoord}px;

    background-color: ${Colors.background.white};
    box-shadow: ${Shadows.medium};
    border-radius: ${Border.radius.small};
`
export const EventBody = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: text;
    min-height: 10px;
`
export const EventHeader = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    align-self: stretch;
    padding: 0px ${Spacing.padding._16};
`
export const EventHeaderIcons = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
`
export const EventDetail = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: ${Spacing.padding._8} 0px;
    gap: ${Spacing.padding._8};
    width: ${MAX_POPUP_LENGTH};
    max-height: ${MAX_POPUP_LENGTH};
    overflow-y: scroll;
`
export const EventTitleSection = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    align-self: stretch;
    padding: 0px ${Spacing.padding._16};
    gap: ${Spacing.padding._8};
`
export const EventDateContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: ${Spacing.padding._8};
`
export const DescriptionContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
    height: 100%;
    overflow-wrap: anywhere;
`
export const ExternalLinkAnchor = styled(NoStyleAnchor)`
    width: 90%;
`
export const IconButton = styled(NoStyleButton)`
    padding: ${Spacing.padding._8};
    border-radius: 50vh;
    &:hover {
        background-color: ${Colors.background.medium};
    }
`
export const EventTitle = styled.span`
    ${Typography.body}
    color: ${Colors.text.black};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
`
export const EventDate = styled.span`
    ${Typography.label}
    color: ${Colors.text.light};
`
export const Description = styled.span`
    ${Typography.label};
    color: ${Colors.text.black};
    padding: 0px ${Spacing.padding._16};
`
