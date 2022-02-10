import { CALENDAR_DEFAULT_SCROLL_HOUR, CELL_HEIGHT } from '../../helpers/styles'
import {
    CalendarCell,
    CalendarRow,
    CalendarTD,
    CalendarTableStyle,
    CellTime,
    EventsContainer,
} from './CalendarEvents-styles'
import { EVENTS_URL, TASKS_FETCH_INTERVAL } from '../../constants'
import React, { Ref, useCallback, useEffect, useRef } from 'react'
import { makeAuthorizedRequest, useInterval } from '../../helpers/utils'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { AbortID } from '../../helpers/enums'
import { setEvents } from '../../redux/tasksPageSlice'
import { TimeIndicator } from './TimeIndicator'
import { findCollisionGroups } from './utils/eventLayout'
import CollisionGroupColumns from './CollisionGroupColumns'

function CalendarTable(): JSX.Element {
    const hourElements = Array(24)
        .fill(0)
        .map((_, index) => (
            <CalendarRow key={index}>
                <CalendarTD>
                    <CalendarCell>
                        <CellTime>{`${(index % 12) + 1}:00`}</CellTime>
                    </CalendarCell>
                </CalendarTD>
            </CalendarRow>
        ))
    return (
        <CalendarTableStyle>
            <tbody>{hourElements}</tbody>
        </CalendarTableStyle>
    )
}
/*
Styling guidelines for events based on duration (inspired by google calendar)
    - If there's room for multiple lines, use multiple lines
    - Otherwise, push onto one line
    - Truncate task title first, hide times if doesn't fit
    - Its okay to remove padding for very short tasks
*/
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
    date: Date
    isToday: boolean
}

export default function CalendarEvents({ date, isToday }: CalendarEventsProps): JSX.Element {
    const eventsContainerRef: Ref<HTMLDivElement> = useRef(null)

    const startDate = new Date(date)
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 1)

    const event_list = useAppSelector((state) => state.tasks_page.events.event_list).filter(
        (event) => new Date(event.datetime_end) >= startDate && new Date(event.datetime_start) <= endDate
    )
    const groups = findCollisionGroups(event_list)

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
            {groups.map((group, index) => (
                <CollisionGroupColumns key={index} events={group} />
            ))}
            {isToday && <TimeIndicator />}
            <CalendarTable />
        </EventsContainer>
    )
}
