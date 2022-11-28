import { DateTime } from 'luxon'
import { logos } from '../../styles/images'
import { TEvent } from '../../utils/types'
import { Icon } from '../atoms/Icon'
import FocusModeContextMenuWrapper from '../radix/EventBodyContextMenuWrapper'
import EventDetailPopover from '../radix/EventDetailPopover'
import { useCalendarContext } from './CalendarContext'
import {
    CELL_HEIGHT_VALUE,
    EventBodyStyle,
    EventFill,
    EventIconAndTitle,
    EventInfo,
    EventInfoContainer,
    EventTime,
    EventTitle,
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
    ignoreCalendarContext?: boolean
}
function EventBody(props: EventBodyProps): JSX.Element {
    const { selectedEvent, setSelectedEvent, isPopoverDisabled, disableSelectEvent } = useCalendarContext(
        props.ignoreCalendarContext
    )
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

    const onClick = () => {
        if (disableSelectEvent) return
        if (selectedEvent?.id === props.event.id) {
            setSelectedEvent(null)
        } else {
            setSelectedEvent(props.event)
        }
    }
    return (
        <div>
            <FocusModeContextMenuWrapper event={props.event}>
                <EventBodyStyle
                    key={props.event.id}
                    squishFactor={props.collisionGroupSize}
                    leftOffset={props.leftOffset}
                    topOffset={top}
                    eventBodyHeight={eventBodyHeight}
                    eventHasEnded={eventHasEnded}
                    isBeingDragged={props.isBeingDragged}
                    isDisabled={disableSelectEvent}
                >
                    <EventInfoContainer onClick={onClick}>
                        <EventDetailPopover event={props.event} date={props.date} hidePopover={isPopoverDisabled}>
                            <EventInfo isLongEvent={isLongEvent}>
                                <EventIconAndTitle>
                                    {props.event.linked_task_id && <Icon icon={logos[props.event.logo]} />}
                                    <EventTitle>{props.event.title || '(no title)'}</EventTitle>
                                </EventIconAndTitle>
                                <EventTime>{`${startTimeString} – ${endTimeString}`}</EventTime>
                            </EventInfo>
                        </EventDetailPopover>
                    </EventInfoContainer>
                    <EventFill
                        squareStart={startedBeforeToday}
                        squareEnd={endedAfterToday}
                        isSelected={selectedEvent?.id === props.event.id}
                    />
                    <ResizeHandle event={props.event} />
                </EventBodyStyle>
            </FocusModeContextMenuWrapper>
        </div>
    )
}

export default EventBody
