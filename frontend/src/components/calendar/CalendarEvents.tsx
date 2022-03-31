import { DateTime } from 'luxon'
import React, { Ref, useEffect, useRef } from 'react'
import { useGetEvents } from '../../services/api-query-hooks'
import { TEvent } from '../../utils/types'
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
    const { data: events } = useGetEvents(
        {
            startISO: date.minus({ days: numDays * 2 }).toISO(),
            endISO: date.plus({ days: numDays * 2 }).toISO(),
        },
        'calendar'
    )
    useEffect(() => {
        if (eventsContainerRef.current) {
            eventsContainerRef.current.scrollTop = CELL_HEIGHT * (CALENDAR_DEFAULT_SCROLL_HOUR - 1)
        }
    }, [])

    const allGroups: TEvent[][][] = []

    for (let i = 0; i < numDays; i++) {
        console.log(i)

        const startDate = date.plus({ days: i }).startOf('day')
        const endDate = startDate.endOf('day')
        const eventList = events?.filter(
            (event) =>
                DateTime.fromISO(event.datetime_end) >= startDate && DateTime.fromISO(event.datetime_start) <= endDate
        )
        allGroups.push(findCollisionGroups(eventList ?? []))
    }

    console.log(allGroups)


    return (
        <AllDaysContainer ref={eventsContainerRef}>
            <TimeContainer>
                <CalendarTimeTable />
            </TimeContainer>
            {
                allGroups.map((groups, dayOffset) => (
                    <DayContainer key={dayOffset}>
                        {groups.map((group, index) => (
                            <CollisionGroupColumns key={index} events={group} date={date.plus({ days: dayOffset })} />
                        ))}
                        {/* date.startOf('day').equals(DateTime.now().startOf('day')) && */<TimeIndicator />}
                        <CalendarDayTable />
                    </DayContainer>
                ))
            }
        </AllDaysContainer>
    )
}
