import { DateTime } from 'luxon'
import React, { useRef, MouseEvent } from 'react'
import { TEvent } from '../../utils/types'
import {
    CELL_HEIGHT_VALUE,
    EventBodyStyle,
    EventFill,
    EventInfo,
    EventInfoContainer,
    EventTime,
    EventTitle,
} from './CalendarEvents-styles'
import EventDetailPopup from '../molecules/EventDetailPopup'

const LONG_EVENT_THRESHOLD = 45 // minutes
const MINIMUM_BODY_HEIGHT = 15 // minutes

interface EventBodyProps {
    event: TEvent
    eventDetailId: string
    setEventDetailId: (id: string) => void
    collisionGroupSize: number
    leftOffset: number
    date: DateTime
    isSelected: boolean
    disableScroll: boolean
    setDisableScroll: (id: boolean) => void
    isEventSelected: boolean
    setIsEventSelected: (id: boolean) => void
}
function EventBody(props: EventBodyProps): JSX.Element {
    const eventRef = useRef<HTMLDivElement>(null)
    const startTime = DateTime.fromISO(props.event.datetime_start)
    const endTime = DateTime.fromISO(props.event.datetime_end)
    const timeDurationMinutes = endTime.diff(startTime).toMillis() / 1000 / 60
    const startedBeforeToday = startTime <= props.date.startOf('day')
    const endedAfterToday = endTime >= props.date.endOf('day')

    const top = startedBeforeToday ? 0 : CELL_HEIGHT_VALUE * startTime.diff(props.date.startOf('day'), 'hours').hours
    const bottom = endedAfterToday
        ? CELL_HEIGHT_VALUE * 24
        : CELL_HEIGHT_VALUE * endTime.diff(props.date.startOf('day'), 'hours').hours
    const eventBodyHeight = Math.max(bottom - top, MINIMUM_BODY_HEIGHT)

    const startTimeString = startTime.toFormat('h:mm') // ex: 3:00
    const endTimeString = endTime.toFormat('h:mm a') // ex: 3:00 PM

    const isLongEvent = timeDurationMinutes >= LONG_EVENT_THRESHOLD
    const eventHasEnded = endTime.toMillis() < DateTime.now().toMillis()
    const xCoordEvent = useRef<number>()
    const yCoordEvent = useRef<number>()

    const onClose = (e: MouseEvent) => {
        if (eventRef.current?.contains(e.target as Node)) return
        props.setEventDetailId('')
        props.setIsEventSelected(false)
        props.setDisableScroll(false)
    }
    const onClick = () => {
        if (props.eventDetailId === props.event.id) {
            props.setEventDetailId('')
            props.setIsEventSelected(false)
            props.setDisableScroll(false)
        } else {
            props.setEventDetailId(props.event.id)
            props.setDisableScroll(!props.disableScroll)
            props.setIsEventSelected(!props.isEventSelected)
        }

        if (!eventRef.current) return
        // Define the x-coord and y-coord of the event to be the bottom left corner
        const pos = eventRef.current.getBoundingClientRect()
        xCoordEvent.current = pos.left
        yCoordEvent.current = pos.bottom
    }

    return (
        <EventBodyStyle
            key={props.event.id}
            squishFactor={props.collisionGroupSize}
            leftOffset={props.leftOffset}
            topOffset={top}
            eventBodyHeight={eventBodyHeight}
            eventHasEnded={eventHasEnded}
            ref={eventRef}
        >
            <EventInfoContainer onClick={onClick}>
                {props.eventDetailId === props.event.id && xCoordEvent.current && yCoordEvent.current && (
                    <EventDetailPopup
                        event={props.event}
                        date={props.date}
                        onClose={onClose}
                        xCoord={xCoordEvent.current}
                        yCoord={yCoordEvent.current}
                        eventHeight={eventBodyHeight}
                    />
                )}
                <EventInfo isLongEvent={isLongEvent}>
                    <EventTitle isLongEvent={isLongEvent}>{props.event.title || '(no title)'}</EventTitle>
                    <EventTime>{`${startTimeString} - ${endTimeString}`}</EventTime>
                </EventInfo>
            </EventInfoContainer>
            <EventFill squareStart={startedBeforeToday} squareEnd={endedAfterToday} isSelected={props.isSelected} />
        </EventBodyStyle>
    )
}

export default EventBody
