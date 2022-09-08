import {
    CopyButton,
    Description,
    EventBoxStyle,
    EventDate,
    EventDateContainer,
    EventHeader,
    EventHeaderIcons,
    EventTitle,
    FlexAnchor,
    IconButton,
} from './EventDetailPopup-styles'
import React, { MouseEvent, useLayoutEffect, useRef, useState } from 'react'
import { icons, logos } from '../../styles/images'
import toast, { ToastId, dismissToast } from '../../utils/toast'

import { DateTime } from 'luxon'
import { EVENT_UNDO_TIMEOUT } from '../../constants'
import Flex from '../atoms/Flex'
import GTButton from '../atoms/buttons/GTButton'
import { Icon } from '../atoms/Icon'
import ReactDOM from 'react-dom'
import { Spacing } from '../../styles'
import { TEvent } from '../../utils/types'
import { useClickOutside, useIsDragging, useNavigateToTask } from '../../hooks'
import { useDeleteEvent } from '../../services/api/events.hooks'
import { useCalendarContext } from '../calendar/CalendarContext'

interface EventDetailProps {
    event: TEvent
    date: DateTime
    onClose: (e?: MouseEvent) => void
    xCoord: number
    yCoord: number
    eventHeight: number
    eventWidth: number
    windowHeight: number
}

const EventDetailPopup = React.forwardRef<HTMLDivElement, EventDetailProps>(
    ({ event, date, onClose, xCoord, yCoord, eventHeight, eventWidth, windowHeight }: EventDetailProps, ref) => {
        const { setSelectedEvent } = useCalendarContext()
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
        const navigateToTask = useNavigateToTask()

        const onDelete = (event: TEvent) => {
            setSelectedEvent(null)
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
                    theme: 'dark',
                }
            )
        }

        // if *anything* drags, close the popup
        const isDragging = useIsDragging()
        if (isDragging) {
            onClose()
            return null
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
                    <Icon icon={logos[event.logo]} size="xSmall" />
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
                <Flex gap={Spacing._8}>
                    {event.linked_task_id && (
                        <GTButton
                            styleType="secondary"
                            size="small"
                            value="View task details"
                            fitContent={false}
                            onClick={() => {
                                setSelectedEvent(null)
                                navigateToTask(event.linked_task_id)
                            }}
                        />
                    )}
                    <FlexAnchor href={event.deeplink} target="_blank">
                        <GTButton
                            styleType="secondary"
                            size="small"
                            value="Google Calendar"
                            icon={icons.external_link}
                            fitContent={false}
                        />
                    </FlexAnchor>
                </Flex>
                {event.conference_call.logo && (
                    <Flex alignItemsCenter>
                        <FlexAnchor href={event.conference_call.url} target="_blank">
                            <GTButton
                                styleType="secondary"
                                size="small"
                                value="Join"
                                icon={event.conference_call.logo}
                                fitContent={false}
                            />
                        </FlexAnchor>
                        <CopyButton onClick={() => navigator.clipboard.writeText(event.conference_call.url)}>
                            <Icon size="xSmall" icon={icons.copy} />
                        </CopyButton>
                    </Flex>
                )}
            </EventBoxStyle>,
            document.getElementById('event-details-popup') as HTMLElement
        )
    }
)

export default EventDetailPopup
