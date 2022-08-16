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
import { TModifyEventData, useDeleteEvent } from '../../services/api/events.hooks'
import toast, { ToastId, dismissToast } from '../../utils/toast'
import produce from 'immer'
import { useGTQueryClient } from '../../services/queryUtils'
import { getMonthsAroundDate } from '../../utils/time'
import { EVENT_UNDO_TIMEOUT } from '../../constants'

interface EventDetailProps {
    event: TEvent
    date: DateTime
    onClose: MouseEventHandler
    xCoord: number
    yCoord: number
    eventHeight: number
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
            windowHeight,
            setIsScrollDisabled,
            setEventDetailId,
        }: EventDetailProps,
        ref
    ) => {
        const popupRef = useRef<HTMLDivElement | null>(null)
        const undoToastRef = useRef<ToastId>()
        const { mutate: deleteEvent } = useDeleteEvent()
        const [popupHeight, setPopupHeight] = useState(0)
        const queryClient = useGTQueryClient()
        useLayoutEffect(() => {
            if (!popupRef.current) return
            setPopupHeight(popupRef.current.getBoundingClientRect().height)
        }, [])
        useClickOutside(popupRef, onClose)

        const startTimeString = DateTime.fromISO(event.datetime_start).toFormat('h:mm')
        const endTimeString = DateTime.fromISO(event.datetime_end).toFormat('h:mm a')

        // optimistic delete
        const helpDeleteEvent = (data: TModifyEventData) => {
            const start = DateTime.fromISO(data.datetime_start)
            const end = DateTime.fromISO(data.datetime_end)
            const timeBlocks = getMonthsAroundDate(date, 1)
            const blockIndex = timeBlocks.findIndex((block) => start >= block.start && end <= block.end)
            const block = timeBlocks[blockIndex]

            queryClient.cancelQueries(['events', 'calendar', block.start.toISO()])

            const events = queryClient.getImmutableQueryData<TEvent[]>(['events', 'calendar', block.start.toISO()])
            if (!events) return
            const newEvents = produce(events, (draft) => {
                const eventIdx = draft.findIndex((event) => event.id === data.id)
                if (eventIdx === -1) return
                draft.splice(eventIdx, 1)
            })
            queryClient.setQueryData(['events', 'calendar', block.start.toISO()], newEvents)
        }

        // optimistic undo
        const helpUndoEvent = (data: TEvent) => {
            const start = DateTime.fromISO(data.datetime_start)
            const end = DateTime.fromISO(data.datetime_end)
            const timeBlocks = getMonthsAroundDate(date, 1)
            const blockIndex = timeBlocks.findIndex((block) => start >= block.start && end <= block.end)
            const block = timeBlocks[blockIndex]
            queryClient.cancelQueries(['events', 'calendar', block.start.toISO()])

            const events = queryClient.getImmutableQueryData<TEvent[]>(['events', 'calendar', block.start.toISO()])
            if (!events) return
            const deletedEvent: TEvent = {
                id: data.id,
                title: data.title,
                body: data.body,
                deeplink: data.deeplink,
                datetime_start: data.datetime_start,
                datetime_end: data.datetime_end,
                conference_call: data.conference_call,
            }

            const newEvents = produce(events, (draft) => {
                draft.push(deletedEvent)
            })
            queryClient.setQueryData(['events', 'calendar', block.start.toISO()], newEvents)
        }

        const onDelete = (event: TEvent) => {
            helpDeleteEvent({
                id: event.id,
                date: date,
                datetime_start: event.datetime_start,
                datetime_end: event.datetime_end,
            })
            setIsScrollDisabled(false)
            setEventDetailId('')
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
                            helpUndoEvent(event)
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
