import { DateTime } from 'luxon'
import React, { Ref, useEffect, useRef } from 'react'
import { useGetEvents } from '../../services/api-query-hooks'
import { TimeIndicator } from './TimeIndicator'
import {
    CalendarCell,
    CalendarRow,
    CalendarTableStyle,
    CalendarTD,
    CALENDAR_DEFAULT_SCROLL_HOUR,
    CellTime,
    CELL_HEIGHT,
    DayContainer,
} from './CalendarEvents-styles'
import CollisionGroupColumns from './CollisionGroupColumns'
import { findCollisionGroups } from './utils/eventLayout'

function CalendarDayTable(): JSX.Element {
    const hourElements = Array(24)
        .fill(0)
        .map((_, index) => {
            const hour = ((index + 11) % 12) + 1
            const isAmPm = (index + 1) <= 12 ? 'am' : 'pm'
            const timeString = `${hour} ${isAmPm}`
            return (
                <CalendarRow key={index}>
                    <CalendarTD>
                        <CalendarCell>
                            <CellTime>{timeString}</CellTime>
                        </CalendarCell>
                    </CalendarTD>
                </CalendarRow>
            )
        })
    return (
        <CalendarTableStyle>
            <tbody>{hourElements}</tbody>
        </CalendarTableStyle>
    )
}

interface CalendarEventsProps {
    date: DateTime
    isToday: boolean
}

export default function CalendarEvents({ date, isToday }: CalendarEventsProps): JSX.Element {
    const eventsContainerRef: Ref<HTMLDivElement> = useRef(null)
    const startDate = date.startOf('day')
    const endDate = startDate.endOf('day')
    const { data: events } = useGetEvents(
        {
            startISO: date.minus({ days: 2 }).toISO(),
            endISO: date.plus({ days: 2 }).toISO(),
        },
        'sidebar'
    )
    const eventList = events?.filter(
        (event) =>
            DateTime.fromISO(event.datetime_end) >= startDate && DateTime.fromISO(event.datetime_start) <= endDate
    )
    const groups = findCollisionGroups(eventList || [])

    useEffect(() => {
        if (eventsContainerRef.current) {
            eventsContainerRef.current.scrollTop = CELL_HEIGHT * (CALENDAR_DEFAULT_SCROLL_HOUR - 1)
        }
    }, [])

    return (
        <DayContainer ref={eventsContainerRef}>
            {groups.map((group, index) => (
                <CollisionGroupColumns key={index} events={group} date={date} />
            ))}
            {isToday && <TimeIndicator />}
            <CalendarDayTable />
        </DayContainer>
    )
}
