import React, { useLayoutEffect, useRef, useState } from 'react'
import { DateTime } from 'luxon'
import { icons, logos } from '../../styles/images'
import { TEvent } from '../../utils/types'
import { Icon } from '../atoms/Icon'
import NoStyleAnchor from '../atoms/NoStyleAnchor'
import ExternalLinkButton from '../atoms/buttons/ExternalLinkButton'
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
} from './EventDetailPopup-styles'

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
                                <Icon source={icons.calendar_blank_dark} size="xSmall" />
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
                        <ExternalLinkButton value="Google Calendar" iconSource="external_link_dark" />
                    </NoStyleAnchor>
                </EventBody>
            </EventBoxStyle>
        </>,
        document.getElementById('portal')!
    )
}

export default EventDetailPopup
