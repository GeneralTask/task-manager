import { DateTime } from 'luxon'
import React, { useRef, MouseEvent, useLayoutEffect, useEffect, useState } from 'react'
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
    isScrollDisabled: boolean
    setIsScrollDisabled: (id: boolean) => void
    isEventSelected: boolean
    setIsEventSelected: (id: boolean) => void
}
function EventBody(props: EventBodyProps): JSX.Element {
    const eventRef = useRef<HTMLDivElement>(null)
    const popupRef = useRef<HTMLDivElement>(null)
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

    const [windowHeight, setWindowHeight] = useState(window.innerHeight)
    const [eventWidth, setEventWidth] = useState(0)
    useLayoutEffect(() => {
        if (!eventRef.current) return
        setEventWidth(eventRef.current.getBoundingClientRect().width)
    }, [])
    const [coords, setCoords] = useState({
        xCoord: 0,
        yCoord: 0,
    })
    const xCoordEvent = useRef<number>()
    const yCoordEvent = useRef<number>()

    useEffect(() => {
        window.addEventListener('resize', handleWindowResize)
        return () => window.removeEventListener('resize', handleWindowResize)
    }, [])

    const onClose = (e: MouseEvent) => {
        if (eventRef.current?.contains(e.target as Node)) return
        props.setEventDetailId('')
        props.setIsEventSelected(false)
        props.setIsScrollDisabled(false)
    }
    const onClick = (e: MouseEvent) => {
        // Prevent popup from closing when user clicks on the popup component
        if (popupRef.current?.contains(e.target as Node)) return
        if (props.eventDetailId === props.event.id) {
            props.setEventDetailId('')
            props.setIsEventSelected(false)
            props.setIsScrollDisabled(false)
        } else {
            props.setEventDetailId(props.event.id)
            props.setIsScrollDisabled(!props.isScrollDisabled)
            props.setIsEventSelected(!props.isEventSelected)
        }

        if (!eventRef.current) return
        // Define the x-coord and y-coord of the event to be the bottom left corner
        xCoordEvent.current = eventRef.current.getBoundingClientRect().left
        yCoordEvent.current = eventRef.current.getBoundingClientRect().bottom

        if (xCoordEvent.current && yCoordEvent.current) {
            setCoords({
                xCoord: xCoordEvent.current,
                yCoord: yCoordEvent.current,
            })
        }
    }
    const handleWindowResize = () => {
        if (eventRef.current) {
            setCoords({
                xCoord: eventRef.current.getBoundingClientRect().left,
                yCoord: eventRef.current.getBoundingClientRect().bottom,
            })
            setEventWidth(eventRef.current.getBoundingClientRect().width)
        }
        setWindowHeight(window.innerHeight)
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
                {props.eventDetailId === props.event.id && (
                    <EventDetailPopup
                        event={props.event}
                        date={props.date}
                        onClose={onClose}
                        xCoord={coords.xCoord}
                        yCoord={coords.yCoord}
                        eventHeight={eventBodyHeight}
                        eventWidth={eventWidth}
                        windowHeight={windowHeight}
                        setIsScrollDisabled={props.setIsScrollDisabled}
                        setEventDetailId={props.setEventDetailId}
                        ref={popupRef}
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
