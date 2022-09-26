import { MouseEvent, useRef } from 'react'
import { DateTime } from 'luxon'
import { logos } from '../../styles/images'
import { TEvent } from '../../utils/types'
import { Icon } from '../atoms/Icon'
import EventDetailPopup from '../molecules/EventDetailPopup'
import { useCalendarContext } from './CalendarContext'
import {
    CELL_HEIGHT_VALUE,
    EventBodyStyle,
    EventFill,
    EventInfo,
    EventInfoContainer,
    EventTime,
    EventTitle,
    IconContainer,
} from './CalendarEvents-styles'
import ResizeHandle from './ResizeHandle'

const LONG_EVENT_THRESHOLD = 45 // minutes
const MINIMUM_BODY_HEIGHT = 15 // minutes

interface EventBodyProps {
    event: TEvent
    collisionGroupSize: number
    leftOffset: number
    date: DateTime
    isBeingDragged?: boolean
}
function EventBody(props: EventBodyProps): JSX.Element {
    const { selectedEvent, setSelectedEvent, isPopoverDisabled } = useCalendarContext()
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

    const onClick = (e: MouseEvent) => {
        // Prevent popup from closing when user clicks on the popup component
        if (popupRef.current?.contains(e.target as Node)) return
        if (selectedEvent?.id === props.event.id) {
            setSelectedEvent(null)
        } else {
            setSelectedEvent(props.event)
        }
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
            isBeingDragged={props.isBeingDragged}
        >
            <EventInfoContainer onClick={onClick}>
                {selectedEvent?.id === props.event.id && !isPopoverDisabled && (
                    <EventDetailPopup event={props.event} date={props.date} eventBodyRef={eventRef} ref={popupRef} />
                )}
                <EventInfo isLongEvent={isLongEvent}>
                    <EventTitle>
                        {props.event.linked_task_id && (
                            <IconContainer>
                                <Icon size="xSmall" icon={logos[props.event.logo]} />
                            </IconContainer>
                        )}
                        {props.event.title || '(no title)'}
                    </EventTitle>
                    <EventTime>{`${startTimeString} - ${endTimeString}`}</EventTime>
                </EventInfo>
            </EventInfoContainer>
            <EventFill
                squareStart={startedBeforeToday}
                squareEnd={endedAfterToday}
                isSelected={selectedEvent?.id === props.event.id}
            />
            <ResizeHandle event={props.event} />
        </EventBodyStyle>
    )
}

export default EventBody
