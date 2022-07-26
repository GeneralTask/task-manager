import { DateTime } from 'luxon'
import React, { useEffect, useState } from 'react'
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

    // const [popupVisible, setPopupVisible] = useState("")

    // const togglePopup = (newEventID: string) => {
    //     // if the user clicks on a new event
    //     // if (popupVisible !== newEventID) {
    //     //     setPopupVisible(newEventID);
    //     // }
    //     // // keep the previous state
    //     // else {
    //     //     setPopupVisible(popupVisible);
    //     // }
    //     // popupVisible ? eventID === props.event.id : eventID;
    //     props.setEventDetailId(newEventID)

    //     console.log('props event id:', newEventID)
    //     console.log('stored event id:', props.eventDetailId)
    // }

    useEffect(() => {
        console.log('updated event details id: ' + props.eventDetailId)
        console.log('actual evend id: ' + props.event.id)
    }),
        [props.eventDetailId]
    const helpHandleClose = () => {
        console.log('woooo i got closed')
        props.setEventDetailId('')
    }

    return (
        <EventBodyStyle
            key={props.event.id}
            squishFactor={props.collisionGroupSize}
            leftOffset={props.leftOffset}
            topOffset={top}
            eventBodyHeight={eventBodyHeight}
            eventHasEnded={eventHasEnded}
        >
            <EventInfoContainer onClick={() => props.setEventDetailId(props.event.id)}>
                {props.eventDetailId === props.event.id && (
                    <EventDetailPopup event={props.event} date={props.date} handleClose={helpHandleClose} />
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
