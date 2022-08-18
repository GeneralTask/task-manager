import { Border, Colors, Spacing, Typography, Shadows } from '../../styles'
import NoStyleButton from '../atoms/buttons/NoStyleButton'
import styled from 'styled-components'

const MAX_POPUP_LENGTH = 315
const MAX_POPUP_HEIGHT = 100

interface EventBoxStyleProps {
    xCoord: number
    yCoord: number
    popupHeight: number
    eventHeight: number
    eventWidth: number
    windowHeight: number
}
/* Calculates the position of the popup depending on the position of the event
Handles edge cases for events below max height (window height - popup height) */
export const EventBoxStyle = styled.div<EventBoxStyleProps>`
    position: absolute;
    box-sizing: border-box;
    padding: ${Spacing.padding._16} ${Spacing.padding._16};
    width: ${MAX_POPUP_LENGTH}px;
    left: ${(props) =>
        props.xCoord <= MAX_POPUP_LENGTH
            ? `calc(${props.xCoord}px + ${props.eventWidth}px)`
            : `calc(${props.xCoord}px - ${MAX_POPUP_LENGTH}px)`};
    top: ${(props) =>
        props.yCoord >= props.windowHeight - props.popupHeight
            ? props.yCoord - props.eventHeight - props.popupHeight
            : props.yCoord}px;

    background-color: ${Colors.background.white};
    box-shadow: ${Shadows.medium};
    border-radius: ${Border.radius.small};
    display: flex;
    flex-direction: column;
    gap: ${Spacing.padding._8};
`
export const EventHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
`
export const EventHeaderIcons = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing.margin._4};
`
export const EventDateContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: ${Spacing.padding._8};
`
export const CloseButton = styled(NoStyleButton)`
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
export const Description = styled.div`
    ${Typography.label};
    color: ${Colors.text.black};
    max-height: ${MAX_POPUP_HEIGHT}px;
    overflow-wrap: break-word;
    overflow-y: auto;
`
