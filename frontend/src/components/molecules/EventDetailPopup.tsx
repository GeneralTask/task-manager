import React, { useLayoutEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { Border, Colors, Spacing, Typography, Shadows } from '../../styles'
import { DateTime } from 'luxon'
import { icons, logos } from '../../styles/images'
import { TEvent } from '../../utils/types'
import { Icon } from '../atoms/Icon'
import NoStyleAnchor from '../atoms/NoStyleAnchor'
import NoStyleButton from '../atoms/buttons/NoStyleButton'
import ExternalLinkButton from '../atoms/buttons/ExternalLinkButton'
import ReactDOM from 'react-dom'
import { useClickOutside } from '../../hooks'

export const POPUP_WIDTH = '315px'
export const WINDOW_HEIGHT = window.innerHeight

interface EventBoxStyleProps {
    xCoord: number
    yCoord: number
    popupHeight: number
    eventHeight: number
}

// Calendar Modal (GCal)
// calculates x and y coordinates of the popup depending on the position of the event, handles edge cases for events >= max height
const EventBoxStyle = styled.div<EventBoxStyleProps>`
    position: absolute;
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    padding: ${Spacing.padding._16} 0px;
    gap: 10px;
    width: ${POPUP_WIDTH};

    left: calc(${(props) => props.xCoord}px - ${POPUP_WIDTH});
    top: ${(props) =>
        props.yCoord >= WINDOW_HEIGHT - props.popupHeight
            ? props.yCoord - props.eventHeight - props.popupHeight
            : props.yCoord}px;

    background-color: ${Colors.background.white};
    box-shadow: ${Shadows.medium};
    border-radius: ${Border.radius.small};
`
// Frame 34281
const EventBody = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: text;
`
// Frame 34279
const EventHeader = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;

    gap: 138px;
    width: 280px;
`
// Frame 34280
const EventHeaderIcons = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;

    gap: ${Spacing.margin._8};
    width: 147px;
`
// Details Content
const EventDetail = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 0px;
    gap: 10px;
    width: 315px;
`
// Task Title (Title + Date)
const EventTitleSection = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    align-self: stretch;
    padding: 0px 18px;
    gap: 10px;
`
// Task Title for Date
const EventDateContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 0px 2px 0px 0px;
    gap: ${Spacing.padding._8};
`
// Comment Section
const DescriptionContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
    word-wrap: normal;
    overflow-wrap: anywhere;
`
// Close Button
const CloseButton = styled(NoStyleButton)`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    padding: ${Spacing.padding._4};
    isolation: isolate;

    border-radius: 30vh;
    &:hover {
        background-color: ${Colors.background.dark};
    }
`
// Event Title
const EventTitle = styled.span`
    ${Typography.subtitle};
    color: ${Colors.text.black};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
`
// Task Title
const EventDate = styled.span`
    ${Typography.label};
    color: ${Colors.text.black};
`
// Event Description
const Description = styled.span`
    ${Typography.label};
    color: ${Colors.text.black};
    padding: 0px 18px;
`

interface EventDetailProps {
    event: TEvent
    date: DateTime
    onClose: () => void
    xCoord: number
    yCoord: number
    eventHeight: number
}

const EventDetailPopup = ({ event, date, onClose, xCoord, yCoord, eventHeight }: EventDetailProps) => {
    const startTime = DateTime.fromISO(event.datetime_start)
    const endTime = DateTime.fromISO(event.datetime_end)

    const startTimeString = startTime.toFormat('h:mm') // ex: 3:00
    const endTimeString = endTime.toFormat('h:mm a') // ex: 3:30 PM

    const [height, setHeight] = useState(0)

    const ref = useRef<HTMLDivElement>(null)
    useLayoutEffect(() => {
        if (!ref.current) {
            return
        }
        setHeight(ref.current.getBoundingClientRect().height)
    })

    // when user clicks outside of popup, close it
    useClickOutside(ref, onClose)

    return ReactDOM.createPortal(
        <>
            <EventBoxStyle xCoord={xCoord} yCoord={yCoord} popupHeight={height} eventHeight={eventHeight} ref={ref}>
                <EventBody>
                    <EventHeader>
                        <Icon source={logos.gcal} size="xSmall" />
                        <EventHeaderIcons>
                            <Icon source={icons.trash_gray} size="xSmall" />
                            <CloseButton
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onClose()
                                }}
                            >
                                <Icon source={icons.exit} size="small" />
                            </CloseButton>
                        </EventHeaderIcons>
                    </EventHeader>
                    <EventDetail>
                        <EventTitleSection>
                            <EventTitle>{event.title}</EventTitle>
                            <EventDateContainer>
                                <Icon source={icons.calendar_blank_darkgray} size="xSmall" />
                                <EventDate>
                                    {`${date.toFormat('cccc, LLLL d')}`} · {`${startTimeString} - ${endTimeString}`}
                                </EventDate>
                            </EventDateContainer>
                        </EventTitleSection>
                        <DescriptionContainer>
                            <Description>{event.body}</Description>
                        </DescriptionContainer>
                    </EventDetail>
                    <NoStyleAnchor href={event.deeplink} target="_blank">
                        <ExternalLinkButton value="Google Calendar" iconSource="external_link_darkgray" />
                    </NoStyleAnchor>
                </EventBody>
            </EventBoxStyle>
        </>,
        document.getElementById('portal')!
    )
}

export default EventDetailPopup
