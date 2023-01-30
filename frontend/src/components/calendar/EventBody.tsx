import { useMemo } from 'react'
import { DateTime } from 'luxon'
import { usePreviewMode } from '../../hooks'
import { useGetCalendars } from '../../services/api/events.hooks'
import { Colors } from '../../styles'
import { logos } from '../../styles/images'
import { TEvent } from '../../utils/types'
import { EdgeHighlight } from '../atoms/SelectableContainer'
import FocusModeContextMenuWrapper from '../radix/EventBodyContextMenuWrapper'
import EventDetailPopover from '../radix/EventDetailPopover'
import { useCalendarContext } from './CalendarContext'
import {
    CELL_HEIGHT_VALUE,
    EventBodyStyle,
    EventFill,
    EventIcon,
    EventIconAndTitle,
    EventInfo,
    EventInfoContainer,
    EventTime,
    EventTitle,
} from './CalendarEvents-styles'
import ResizeHandle from './ResizeHandle'
import getCalendarColor from './utils/colors'

const LONG_EVENT_THRESHOLD = 60 // minutes
const SHORT_EVENT_THRESHOLD = 45 // minutes
const MINIMUM_BODY_HEIGHT = 15 // minutes

interface EventBodyProps {
    event: TEvent
    collisionGroupSize: number
    leftOffset: number
    date: DateTime
    isBeingDragged?: boolean
}
function EventBody(props: EventBodyProps): JSX.Element {
    const { isPreviewMode } = usePreviewMode()
    const { selectedEvent, setSelectedEvent, isPopoverDisabled, disableSelectEvent } = useCalendarContext()
    const startTime = DateTime.fromISO(props.event.datetime_start)
    const endTime = DateTime.fromISO(props.event.datetime_end)
    const { data: calendars } = useGetCalendars()
    const calendar = useMemo(
        () =>
            calendars
                ?.find((account) => account.account_id === props.event.account_id)
                ?.calendars.find((calendar) => calendar.calendar_id === props.event.calendar_id),
        [props.event, calendars]
    )

    const timeDurationMillis = endTime.diff(startTime).toMillis()
    const timeDurationTodayMinutes =
        Math.min(
            timeDurationMillis,
            +props.date.endOf('day').diff(startTime),
            +endTime.diff(props.date.startOf('day'))
        ) /
        1000 /
        60
    const startedBeforeToday = startTime <= props.date.startOf('day')
    const endedAfterToday = endTime >= props.date.endOf('day')

    const top = startedBeforeToday ? 0 : CELL_HEIGHT_VALUE * startTime.diff(props.date.startOf('day'), 'hours').hours
    const bottom = endedAfterToday
        ? CELL_HEIGHT_VALUE * 24
        : CELL_HEIGHT_VALUE * endTime.diff(props.date.startOf('day'), 'hours').hours
    const eventBodyHeight = Math.max(bottom - top, MINIMUM_BODY_HEIGHT)

    const startTimeString = startTime.toFormat('h:mm') // ex: 3:00
    const endTimeString = endTime.toFormat('h:mm a') // ex: 3:00 PM
    const startTimeOnlyString = startTime.toFormat('h:mm a') // ex: 3:00 PM

    const eventType =
        timeDurationTodayMinutes >= LONG_EVENT_THRESHOLD
            ? 'long'
            : timeDurationTodayMinutes < SHORT_EVENT_THRESHOLD
            ? 'short'
            : 'medium'
    const eventHasEnded = endTime.toMillis() < DateTime.now().toMillis()

    const onClick = () => {
        if (disableSelectEvent) return
        setSelectedEvent(props.event)
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
                            <EventInfo type={eventType}>
                                <EventIconAndTitle>
                                    {props.event.linked_task_id && (
                                        <EventIcon
                                            icon={logos[props.event.logo]}
                                            isShort={timeDurationTodayMinutes <= MINIMUM_BODY_HEIGHT}
                                        />
                                    )}
                                    <EventTitle>{props.event.title || '(no title)'}</EventTitle>
                                </EventIconAndTitle>
                                <EventTime>
                                    {eventType === 'short'
                                        ? startTimeOnlyString
                                        : `${startTimeString} – ${endTimeString}`}
                                </EventTime>
                            </EventInfo>
                        </EventDetailPopover>
                    </EventInfoContainer>
                    <EventFill
                        squareStart={startedBeforeToday}
                        squareEnd={endedAfterToday}
                        isSelected={selectedEvent?.id === props.event.id}
                        backgroundColorHex={
                            // fall back to calendar color_id if the event doesn't have a color_id
                            isPreviewMode
                                ? getCalendarColor(props.event.color_id || calendar?.color_id || '')
                                : Colors.background.white
                        }
                    />
                    <EdgeHighlight color="blue" squareStart={startedBeforeToday} squareEnd={endedAfterToday} />
                    <ResizeHandle event={props.event} />
                </EventBodyStyle>
            </FocusModeContextMenuWrapper>
        </div>
    )
}

export default EventBody
