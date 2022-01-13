import { CALENDAR_DEFAULT_SCROLL_HOUR, CELL_HEIGHT } from '../../helpers/styles'
import { CalendarCell, CalendarRow, CalendarTD, CalendarTableStyle, CellTime, EventBodyStyle, EventDescription, EventFill, EventFillContinues, EventTime, EventTitle, EventsContainer } from './CalendarEvents-styles'
import { EVENTS_URL, TASKS_FETCH_INTERVAL } from '../../constants'
import React, { Ref, useCallback, useEffect, useRef } from 'react'
import { makeAuthorizedRequest, useInterval } from '../../helpers/utils'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'

import { AbortID } from '../../helpers/enums'
import { TEvent } from '../../helpers/types'
import { TimeIndicator } from './TimeIndicator'
import { setEvents } from '../../redux/tasksPageSlice'

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

function useFetchEvents(): (start: Date, end: Date) => Promise<void> {
    const dispatch = useAppDispatch()
    const fetchEvents = useCallback(async (start: Date, end: Date) => {
        try {
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

interface CalendarEventsProps {
    date: Date,
    isToday: boolean,
}
export default function CalendarEvents({ date, isToday }: CalendarEventsProps): JSX.Element {
    const eventsContainerRef: Ref<HTMLDivElement> = useRef(null)

    const startDate = new Date(date)
    startDate.setHours(0, 0, 0, 0)
    const start = startDate.toISOString()
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 1)
    const end = endDate.toISOString()

    const event_list = useAppSelector(
        (state) => state.tasks_page.events.event_list
    ).filter((event: { datetime_end: string; datetime_start: string }) => (event.datetime_end >= start && event.datetime_start <= end))

    const fetchEvents = useFetchEvents()
    const fetchEventsAroundDate = useCallback(() => {
        const start = new Date(date)
        start.setDate(date.getDate() - 3)
        start.setHours(0, 0, 0, 0)

        const end = new Date(date)
        end.setDate(date.getDate() + 3)
        end.setHours(23, 59, 59, 999)

        fetchEvents(start, end)
    }, [date])

    useInterval(fetchEventsAroundDate, TASKS_FETCH_INTERVAL)

    useEffect(() => {
        if (eventsContainerRef.current) {
            eventsContainerRef.current.scrollTop = CELL_HEIGHT * (CALENDAR_DEFAULT_SCROLL_HOUR - 1)
        }
    }, [])

    return (
        <EventsContainer ref={eventsContainerRef}>
            {event_list.map((event) => <EventBody key={event.id} event={event} />)}
            {isToday && <TimeIndicator />}
            <CalendarTable />
        </EventsContainer>
    )
}

