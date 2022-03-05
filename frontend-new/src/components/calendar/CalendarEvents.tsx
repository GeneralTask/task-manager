import {
    CalendarCell,
    CalendarRow,
    CalendarTD,
    CalendarTableStyle,
    CellTime,
    DayContainer,
    CELL_HEIGHT,
    CALENDAR_DEFAULT_SCROLL_HOUR,
} from './CalendarEvents-styles'
import React, { Ref, useEffect, useRef } from 'react'
import { TimeIndicator } from './TimeIndicator'
import { findCollisionGroups } from './utils/eventLayout'
import CollisionGroupColumns from './CollisionGroupColumns'
import { DateTime } from 'luxon'
import { useGetEventsQuery } from '../../services/generalTaskApi'

interface CalendarDayTableProps {
    showTimes: boolean
}
function CalendarDayTable({ showTimes }: CalendarDayTableProps): JSX.Element {
    const hourElements = Array(24)
        .fill(0)
        .map((_, index) => (
            <CalendarRow key={index}>
                <CalendarTD>
                    <CalendarCell>{showTimes && <CellTime>{`${(index % 12) + 1}:00`}</CellTime>}</CalendarCell>
                </CalendarTD>
            </CalendarRow>
        ))
    return (
        <CalendarTableStyle>
            <tbody>{hourElements}</tbody>
        </CalendarTableStyle>
    )
}

interface CalendarEventsProps {
    date: DateTime
    isToday: boolean
    showTimes: boolean
    scroll: boolean
}

export default function CalendarEvents({ date, isToday, showTimes, scroll }: CalendarEventsProps): JSX.Element {
    const eventsContainerRef: Ref<HTMLDivElement> = useRef(null)

    const startDate = date.startOf('day')
    const endDate = startDate.plus({ days: 1 })

    const { data: events } = useGetEventsQuery({ startISO: date.minus({ days: 7 }).toISO(), endISO: date.plus({ days: 7 }).toISO() })
    const eventList = events?.filter((event) => DateTime.fromISO(event.datetime_end) >= startDate && DateTime.fromISO(event.datetime_start) <= endDate)
    const groups = findCollisionGroups(eventList || [])


    useEffect(() => {
        if (eventsContainerRef.current) {
            eventsContainerRef.current.scrollTop = CELL_HEIGHT * (CALENDAR_DEFAULT_SCROLL_HOUR - 1)
        }
    }, [])

    return (
        <DayContainer ref={eventsContainerRef} scroll={scroll}>
            {groups.map((group, index) => (
                <CollisionGroupColumns key={index} events={group} />
            ))}
            {isToday && <TimeIndicator />}
            <CalendarDayTable showTimes={showTimes} />
        </DayContainer>
    )
}
