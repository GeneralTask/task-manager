import React, { MouseEvent, MouseEventHandler, useLayoutEffect, useRef, useState } from 'react'
import { DateTime } from 'luxon'
import { icons, logos } from '../../styles/images'
import { TEvent } from '../../utils/types'
import { Icon } from '../atoms/Icon'
import ReactDOM from 'react-dom'
import { useClickOutside } from '../../hooks'
import {
    EventBoxStyle,
    EventBody,
    EventHeader,
    EventHeaderIcons,
    CloseButton,
    EventDetail,
    EventTitleSection,
    EventTitle,
    EventDateContainer,
    EventDate,
    DescriptionContainer,
    Description,
    ExternalLinkAnchor,
} from './EventDetailPopup-styles'
import GTButton from '../atoms/buttons/GTButton'

interface EventDetailProps {
    event: TEvent
    date: DateTime
    onClose: MouseEventHandler
    xCoord: number
    yCoord: number
    eventHeight: number
}

const EventDetailPopup = React.forwardRef<HTMLDivElement, EventDetailProps>(
    ({ event, date, onClose, xCoord, yCoord, eventHeight }: EventDetailProps, ref) => {
        const popupRef = useRef<HTMLDivElement>(null)
        const [popupHeight, setPopupHeight] = useState(0)
        useLayoutEffect(() => {
            if (!popupRef.current) return
            setPopupHeight(popupRef.current.getBoundingClientRect().height)
        })
        useClickOutside(popupRef, onClose)
        const startTimeString = DateTime.fromISO(event.datetime_start).toFormat('h:mm')
        const endTimeString = DateTime.fromISO(event.datetime_end).toFormat('h:mm a')
        return ReactDOM.createPortal(
            <EventBoxStyle
                xCoord={xCoord}
                yCoord={yCoord}
                popupHeight={popupHeight}
                eventHeight={eventHeight}
                ref={popupRef}
            >
                <EventBody ref={ref}>
                    <EventHeader>
                        <Icon source={logos.gcal} size="xSmall" />
                        <EventHeaderIcons>
                            <CloseButton
                                onClick={(e) => {
                                    onClose(e as MouseEvent)
                                }}
                            >
                                <Icon source={icons.x_thin_light} size="xSmall" />
                            </CloseButton>
                        </EventHeaderIcons>
                    </EventHeader>
                    <EventDetail>
                        <EventTitleSection>
                            <EventTitle>{event.title}</EventTitle>
                            <EventDateContainer>
                                <Icon source={icons.calendar_blank_light} size="xSmall" />
                                <EventDate>
                                    {`${date.toFormat('cccc, LLLL d')}`} · {`${startTimeString} - ${endTimeString}`}
                                </EventDate>
                            </EventDateContainer>
                        </EventTitleSection>
                        <DescriptionContainer>
                            <Description>{event.body}</Description>
                        </DescriptionContainer>
                    </EventDetail>
                    <ExternalLinkAnchor href={event.deeplink} target="_blank">
                        <GTButton
                            styleType="secondary"
                            size="small"
                            value="Google Calendar"
                            iconSource="external_link_dark"
                            fitContent={false}
                        />
                    </ExternalLinkAnchor>
                </EventBody>
            </EventBoxStyle>,
            document.getElementById('event-details-popup') as HTMLElement
        )
    }
)

export default EventDetailPopup
