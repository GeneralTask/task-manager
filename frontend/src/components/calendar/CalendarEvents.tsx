import React, { Ref, useCallback, useEffect, useRef } from 'react'
import { TEvent } from '../../helpers/types'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { CALENDAR_DEFAULT_SCROLL_HOUR, CELL_HEIGHT } from '../../helpers/styles'
import { CalendarRow, CalendarTD, CalendarCell, CellTime, CalendarTableStyle, EventBodyStyle, EventDescription, EventTitle, EventTime, EventFill, EventsContainer, EventFillContinues } from './CalendarEvents-styles'
import { EVENTS_URL, TASKS_FETCH_INTERVAL } from '../../constants'
import { makeAuthorizedRequest, useInterval } from '../../helpers/utils'
import { setEvents } from '../../redux/tasksPageSlice'
import { TimeIndicator } from './TimeIndicator'
import { AbortID } from '../../redux/enums'

function CalendarTable(): JSX.Element {
    const hourElements = Array(24).fill(0).map((_, index) => (
        <CalendarRow key={index}>
            <CalendarTD>
                <CalendarCell>
                    <CellTime>{`${(index) % 12 + 1}:00`}</CellTime>
                </CalendarCell>
            </CalendarTD>
        </CalendarRow>
    ))
    return (
        <CalendarTableStyle>
            <tbody>
                {hourElements}
            </tbody>
        </CalendarTableStyle>
    )
}

interface EventBodyProps {
    event: TEvent,
}
function EventBody({ event }: EventBodyProps): JSX.Element {
    const startTime = new Date(event.datetime_start)
    const endTime = new Date(event.datetime_end)
    const timeDurationHours = (endTime.getTime() - startTime.getTime()) / 1000 / 60 / 60

    const rollsOverMidnight = endTime.getDay() !== startTime.getDay()
    const eventBodyHeight = rollsOverMidnight ?
        (new Date(startTime).setHours(24, 0, 0, 0) - startTime.getTime()) / 1000 / 3600 * CELL_HEIGHT : timeDurationHours * CELL_HEIGHT

    const startTimeHours = startTime.getHours() - 1
    const startTimeMinutes = startTime.getMinutes()
    const topOffset = ((60 * startTimeHours) + startTimeMinutes) * (CELL_HEIGHT / 60)

    const MMHH = { hour: 'numeric', minute: 'numeric', hour12: true } as const
    const startTimeString = startTime.toLocaleString('en-US', MMHH).replace(/AM|PM/, '')
    const endTimeString = endTime.toLocaleString('en-US', MMHH)

    return (
        <EventBodyStyle key={event.id} topOffset={topOffset} eventBodyHeight={eventBodyHeight}>
            <EventDescription>
                <EventTitle>
                    {event.title}
                </EventTitle>
                <EventTime>
                    {`${startTimeString} - ${endTimeString}`}
                </EventTime>
            </EventDescription>
            {rollsOverMidnight ? <EventFillContinues /> : <EventFill />}
        </EventBodyStyle>
    )
}

function useFetchEvents(): () => Promise<void> {
    const dispatch = useAppDispatch()
    const fetchEvents = useCallback(async () => {
        try {
            const start = new Date()
            start.setHours(0, 0, 0, 0)
            const end = new Date()
            end.setHours(23, 59, 59, 999)
            const response = await makeAuthorizedRequest({
                url: EVENTS_URL,
                method: 'GET',
                params: {
                    datetime_start: start.toISOString(),
                    datetime_end: end.toISOString(),
                },
                abortID: AbortID.EVENTS,
            })
            if (response.ok) {
                const resj = await response.json()
                dispatch(setEvents(resj))
            }
        } catch (e) {
            console.log({ e })
        }
    }, [])
    return fetchEvents
}

export default function CalendarEvents(): JSX.Element {
    const eventsContainerRef: Ref<HTMLDivElement> = useRef(null)
    const event_list = useAppSelector((state) => state.tasks_page.events.event_list)
    const fetchEvents = useFetchEvents()
    useInterval(fetchEvents, TASKS_FETCH_INTERVAL)

    useEffect(() => {
        if (eventsContainerRef.current) {
            eventsContainerRef.current.scrollTop = CELL_HEIGHT * (CALENDAR_DEFAULT_SCROLL_HOUR - 1)
        }
    }, [])

    return (
        <EventsContainer ref={eventsContainerRef}>
            {event_list.map((event) => <EventBody key={event.id} event={event} />)}
            <TimeIndicator />
            <CalendarTable />
        </EventsContainer>
    )
}

