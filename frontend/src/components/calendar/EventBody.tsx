import { DateTime } from 'luxon'
import React, { MouseEvent, useCallback, useEffect, useRef, useState } from 'react'
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
    // isSelected: boolean
    // setIsSelected: (id: boolean) => void
    collisionGroupSize: number
    leftOffset: number
    date: DateTime
}
function EventBody(props: EventBodyProps): JSX.Element {
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

    const ref = useRef<HTMLDivElement>(null) // get access to component in DOM

    // here, I define the x-coord and y-coord of the event to be the bottom left corner
    // const xCoordEvent = useRef<number>()
    // const yCoordEvent = useRef<number>()

    const xCoordEvent2 = useRef<number>()
    const yCoordEvent2 = useRef<number>()

    const helpHandleClose = (e: MouseEvent) => {
        e.stopPropagation()
        props.setEventDetailId('')
        // props.setIsSelected(false)
    }

    // this yCoord is not currectly being updated after scrolling - keeps the previous yCoord position
    const onClick = () => {
        // props.setIsSelected(!props.isSelected)
        props.setEventDetailId(props.event.id)

        if (!ref.current) {
            return
        }

        const pos2 = ref.current.getBoundingClientRect()
        xCoordEvent2.current = pos2.left
        yCoordEvent2.current = pos2.bottom
        console.log('ycoord inside onClick(): ', yCoordEvent2.current)
    }

    // useEffect (() => {
    //     // For positioning
    //     if (!ref.current) {
    //         return
    //     }
    //     const pos = ref.current.getBoundingClientRect()
    //     xCoordEvent.current = pos.left
    //     yCoordEvent.current = pos.bottom

    //     console.log(props.event.title)
    //     console.log('xcoord', xCoordEvent.current)
    //     console.log('ycoord', yCoordEvent.current)
    //     //console.log('window scroll ycoord:', ref.current.scrollTop)
    // })

    return (
        <EventBodyStyle
            key={props.event.id}
            squishFactor={props.collisionGroupSize}
            leftOffset={props.leftOffset}
            topOffset={top}
            eventBodyHeight={eventBodyHeight}
            eventHasEnded={eventHasEnded}
            ref={ref}
        >
            <EventInfoContainer onClick={onClick}>
                {props.eventDetailId === props.event.id && (
                    <EventDetailPopup
                        event={props.event}
                        date={props.date}
                        handleClose={helpHandleClose}
                        xCoord={xCoordEvent2.current!}
                        yCoord={yCoordEvent2.current}
                    />
                )}
                <EventInfo isLongEvent={isLongEvent}>
                    <EventTitle isLongEvent={isLongEvent}>{props.event.title || '(no title)'}</EventTitle>
                    <EventTime>{`${startTimeString} - ${endTimeString}`}</EventTime>
                </EventInfo>
            </EventInfoContainer>
            <EventFill squareStart={startedBeforeToday} squareEnd={endedAfterToday} />
        </EventBodyStyle>
    )
}

export default EventBody
