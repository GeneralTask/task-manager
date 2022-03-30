import { DateTime } from 'luxon'
import React, { Ref, useEffect, useRef, useState } from 'react'
import { useGetEvents } from '../../services/api-query-hooks'
import {
    AllDaysContainer,
    CalendarCell,
    CalendarRow,
    CalendarTableStyle,
    CalendarTD,
    CalendarTimesTableStyle,
    CALENDAR_DEFAULT_SCROLL_HOUR,
    CellTime,
    CELL_HEIGHT,
    DayContainer,
    TimeContainer
} from './CalendarEvents-styles'
import CollisionGroupColumns from './CollisionGroupColumns'
import { TimeIndicator } from './TimeIndicator'
import { findCollisionGroups } from './utils/eventLayout'

function CalendarDayTable(): JSX.Element {
    const hourElements = Array(24)
        .fill(0)
        .map((_, index) => {
            return (
                <CalendarRow key={index}>
                    <CalendarTD />
                </CalendarRow>
            )
        })
    return (
        <CalendarTableStyle>
            <tbody>{hourElements}</tbody>
        </CalendarTableStyle>
    )
}

function CalendarTimeTable(): JSX.Element {
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
        <CalendarTimesTableStyle>
            <tbody>{hourElements}</tbody>
        </CalendarTimesTableStyle>
    )
}

interface CalendarEventsProps {
    date: DateTime
    numDays: number
}

export default function CalendarEvents({ date, numDays }: CalendarEventsProps): JSX.Element {
    const eventsContainerRef: Ref<HTMLDivElement> = useRef(null)
    const [selectedDateIsToday, setSelectedDateIsToday] = useState<boolean>(false)
    const startDate = date.startOf('day')
    const endDate = startDate.endOf('day')
    const { data: events } = useGetEvents(
        {
            startISO: date.minus({ days: numDays }).toISO(),
            endISO: date.plus({ days: numDays }).toISO(),
        },
        'sidebar'
    )
    const eventList = events?.filter(
        (event) =>
            DateTime.fromISO(event.datetime_end) >= startDate && DateTime.fromISO(event.datetime_start) <= endDate
    )
    const groups = findCollisionGroups(eventList ?? [])

    useEffect(() => {
        setSelectedDateIsToday(startDate.equals(DateTime.now().startOf('day')))
    }, [date])

    useEffect(() => {
        if (eventsContainerRef.current) {
            eventsContainerRef.current.scrollTop = CELL_HEIGHT * (CALENDAR_DEFAULT_SCROLL_HOUR - 1)
        }
    }, [])

    return (
        <AllDaysContainer ref={eventsContainerRef}>
            <TimeContainer>
                <CalendarTimeTable />
            </TimeContainer>
            <DayContainer>
                {groups.map((group, index) => (
                    <CollisionGroupColumns key={index} events={group} date={date} />
                ))}
                {selectedDateIsToday && <TimeIndicator />}
                <CalendarDayTable />
            </DayContainer>
            <DayContainer>
                {groups.map((group, index) => (
                    <CollisionGroupColumns key={index} events={group} date={date} />
                ))}
                {selectedDateIsToday && <TimeIndicator />}
                <CalendarDayTable />
            </DayContainer>
        </AllDaysContainer>
    )
}
