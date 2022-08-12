import React, { MouseEvent, MouseEventHandler, useLayoutEffect, useRef, useState } from 'react'
import { DateTime } from 'luxon'
import { icons, logos } from '../../styles/images'
import { TEvent } from '../../utils/types'
import { Icon } from '../atoms/Icon'
import ReactDOM from 'react-dom'
import { useClickOutside } from '../../hooks'
import {
    EventBoxStyle,
    EventHeader,
    EventHeaderIcons,
    EventTitle,
    EventDateContainer,
    EventDate,
    Description,
    IconButton,
} from './EventDetailPopup-styles'
import GTButton from '../atoms/buttons/GTButton'
import NoStyleAnchor from '../atoms/NoStyleAnchor'
import { useDeleteEvent } from '../../services/api/events.hooks'

interface EventDetailProps {
    event: TEvent
    date: DateTime
    onClose: MouseEventHandler
    xCoord: number
    yCoord: number
    eventHeight: number
    setIsScrollDisabled: (id: boolean) => void
}

const EventDetailPopup = React.forwardRef<HTMLDivElement, EventDetailProps>(
    ({ event, date, onClose, xCoord, yCoord, eventHeight, setIsScrollDisabled }: EventDetailProps, ref) => {
        const popupRef = useRef<HTMLDivElement | null>(null)
        const { mutate: deleteEvent } = useDeleteEvent()
        const [popupHeight, setPopupHeight] = useState(0)
        useLayoutEffect(() => {
            if (!popupRef.current) return
            setPopupHeight(popupRef.current.getBoundingClientRect().height)
        }, [])
        useClickOutside(popupRef, onClose)
        const startTimeString = DateTime.fromISO(event.datetime_start).toFormat('h:mm')
        const endTimeString = DateTime.fromISO(event.datetime_end).toFormat('h:mm a')
        const onDelete = async (id: string) => {
            deleteEvent({
                id: id,
                date: date,
                datetime_start: event.datetime_start,
                datetime_end: event.datetime_end,
            })
            setIsScrollDisabled(false)
        }
        return ReactDOM.createPortal(
            <EventBoxStyle
                xCoord={xCoord}
                yCoord={yCoord}
                popupHeight={popupHeight}
                eventHeight={eventHeight}
                ref={(node) => {
                    popupRef.current = node
                    if (typeof ref === 'function') {
                        ref(node)
                    } else if (ref !== null) {
                        ref.current = node
                    }
                }}
            >
                <EventHeader>
                    <Icon source={logos.gcal} size="xSmall" />
                    <EventHeaderIcons>
                        <IconButton onClick={() => onDelete(event.id)}>
                            <Icon source={icons.trash_light} size="xSmall" />
                        </IconButton>
                        <IconButton
                            onClick={(e) => {
                                onClose(e as MouseEvent)
                            }}
                        >
                            <Icon source={icons.x_thin_light} size="xSmall" />
                        </IconButton>
                    </EventHeaderIcons>
                </EventHeader>
                <EventTitle>{event.title}</EventTitle>
                <EventDateContainer>
                    <Icon source={icons.calendar_blank_light} size="xSmall" />
                    <EventDate>
                        {`${date.toFormat('cccc, LLLL d')}`} · {`${startTimeString} - ${endTimeString}`}
                    </EventDate>
                </EventDateContainer>
                <Description>{event.body}</Description>
                <NoStyleAnchor href={event.deeplink} target="_blank">
                    <GTButton
                        styleType="secondary"
                        size="small"
                        value="Google Calendar"
                        iconSource="external_link_dark"
                        fitContent={false}
                    />
                </NoStyleAnchor>
            </EventBoxStyle>,
            document.getElementById('event-details-popup') as HTMLElement
        )
    }
)

export default EventDetailPopup
