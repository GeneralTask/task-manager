import {
    Description,
    EventBoxStyle,
    EventDate,
    EventDateContainer,
    EventHeader,
    EventHeaderIcons,
    EventTitle,
    IconButton,
} from './EventDetailPopup-styles'
import React, { MouseEvent, MouseEventHandler, useLayoutEffect, useRef, useState } from 'react'
import { icons, logos } from '../../styles/images'
import toast, { ToastId, dismissToast } from '../../utils/toast'

import { DateTime } from 'luxon'
import { EVENT_UNDO_TIMEOUT } from '../../constants'
import GTButton from '../atoms/buttons/GTButton'
import { Icon } from '../atoms/Icon'
import NoStyleAnchor from '../atoms/NoStyleAnchor'
import ReactDOM from 'react-dom'
import { TEvent } from '../../utils/types'
import { useClickOutside } from '../../hooks'
import { useDeleteEvent } from '../../services/api/events.hooks'

interface EventDetailProps {
    event: TEvent
    date: DateTime
    onClose: MouseEventHandler
    xCoord: number
    yCoord: number
    eventHeight: number
    eventWidth: number
    windowHeight: number
    setIsScrollDisabled: (id: boolean) => void
    setEventDetailId: (id: string) => void
}

const EventDetailPopup = React.forwardRef<HTMLDivElement, EventDetailProps>(
    (
        {
            event,
            date,
            onClose,
            xCoord,
            yCoord,
            eventHeight,
            eventWidth,
            windowHeight,
            setIsScrollDisabled,
            setEventDetailId,
        }: EventDetailProps,
        ref
    ) => {
        const popupRef = useRef<HTMLDivElement | null>(null)
        const undoToastRef = useRef<ToastId>()
        const { mutate: deleteEvent, deleteEventInCache, undoDeleteEventInCache } = useDeleteEvent()
        const [popupHeight, setPopupHeight] = useState(0)
        useLayoutEffect(() => {
            if (!popupRef.current) return
            setPopupHeight(popupRef.current.getBoundingClientRect().height)
        }, [])
        useClickOutside(popupRef, onClose)

        const startTimeString = DateTime.fromISO(event.datetime_start).toFormat('h:mm')
        const endTimeString = DateTime.fromISO(event.datetime_end).toFormat('h:mm a')

        const onDelete = (event: TEvent) => {
            setIsScrollDisabled(false)
            setEventDetailId('')
            deleteEventInCache({
                id: event.id,
                date: date,
                datetime_start: event.datetime_start,
                datetime_end: event.datetime_end,
            })
            const timeout = setTimeout(() => {
                deleteEvent({
                    id: event.id,
                    date: date,
                    datetime_start: event.datetime_start,
                    datetime_end: event.datetime_end,
                })
            }, EVENT_UNDO_TIMEOUT * 1000)
            undoToastRef.current = toast(
                {
                    message: 'This calendar event has been deleted',
                    rightAction: {
                        label: 'Undo',
                        onClick: () => {
                            clearTimeout(timeout)
                            dismissToast(undoToastRef.current)
                            undoDeleteEventInCache(event, date)
                        },
                    },
                },
                {
                    autoClose: EVENT_UNDO_TIMEOUT * 1000,
                    pauseOnFocusLoss: false,
                }
            )
        }
        return ReactDOM.createPortal(
            <EventBoxStyle
                xCoord={xCoord}
                yCoord={yCoord}
                popupHeight={popupHeight}
                eventHeight={eventHeight}
                eventWidth={eventWidth}
                windowHeight={windowHeight}
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
                    <Icon icon={logos.gcal} size="xSmall" />
                    <div>{event.id}</div>
                    <EventHeaderIcons>
                        <IconButton onClick={() => onDelete(event)}>
                            <Icon icon={icons.trash} size="xSmall" />
                        </IconButton>
                        <IconButton
                            onClick={(e) => {
                                onClose(e as MouseEvent)
                            }}
                        >
                            <Icon icon={icons.x} size="xSmall" />
                        </IconButton>
                    </EventHeaderIcons>
                </EventHeader>
                <EventTitle>{event.title}</EventTitle>
                <EventDateContainer>
                    <Icon icon={icons.calendar_blank} size="xSmall" />
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
                        icon={icons.external_link}
                        fitContent={false}
                    />
                </NoStyleAnchor>
            </EventBoxStyle>,
            document.getElementById('event-details-popup') as HTMLElement
        )
    }
)

export default EventDetailPopup
