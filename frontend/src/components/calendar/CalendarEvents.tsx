import { CALENDAR_DEFAULT_SCROLL_HOUR, CELL_HEIGHT } from '../../helpers/styles'
import {
    CalendarCell,
    CalendarRow,
    CalendarTD,
    CalendarTableStyle,
    CellTime,
    DayContainer,
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
import { DateTime } from 'luxon'

interface CalendarDayTableProps {
    showTimes: boolean
}
function CalendarDayTable({ showTimes }: CalendarDayTableProps): JSX.Element {
    const hourElements = Array(24)
        .fill(0)
        .map((_, index) => (
            <CalendarRow key={index}>
                <CalendarTD>
                    <CalendarCell>
                        {showTimes && <CellTime>{`${(index % 12) + 1}:00`}</CellTime>}
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
function useFetchEvents(): (start: DateTime, end: DateTime) => Promise<void> {
    const dispatch = useAppDispatch()
    const fetchEvents = useCallback(async (start: DateTime, end: DateTime) => {
        try {
            const response = await makeAuthorizedRequest({
                url: EVENTS_URL,
                method: 'GET',
                params: {
                    datetime_start: start.toISO(),
                    datetime_end: end.toISO(),
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
    date: DateTime
    isToday: boolean
    showTimes: boolean
}

export default function CalendarEvents({ date, isToday, showTimes }: CalendarEventsProps): JSX.Element {
    const eventsContainerRef: Ref<HTMLDivElement> = useRef(null)

    const startDate = date.startOf('day')
    const endDate = startDate.plus({ days: 1 })

    const event_list = useAppSelector((state) => state.tasks_page.events.event_list).filter(
        (event) => DateTime.fromISO(event.datetime_end) >= startDate && DateTime.fromISO(event.datetime_start) <= endDate
    )
    const groups = findCollisionGroups(event_list)

    const fetchEvents = useFetchEvents()
    const fetchEventsAroundDate = useCallback(() => {
        const start = date.startOf('day').minus({ days: 7 })
        const end = date.endOf('day').plus({ days: 7 })
        fetchEvents(start, end)
    }, [date])

    useInterval(fetchEventsAroundDate, TASKS_FETCH_INTERVAL)

    useEffect(() => {
        if (eventsContainerRef.current) {
            eventsContainerRef.current.scrollTop = CELL_HEIGHT * (CALENDAR_DEFAULT_SCROLL_HOUR - 1)
        }
    }, [])

    return (
        <DayContainer ref={eventsContainerRef}>
            {groups.map((group, index) => (<CollisionGroupColumns key={index} events={group} />))}
            {isToday && <TimeIndicator />}
            <CalendarDayTable showTimes={showTimes} />
        </DayContainer>
    )
}
