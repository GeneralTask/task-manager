import { DateTime } from 'luxon'
import React, { Ref, useEffect, useMemo, useRef } from 'react'
import { EVENTS_REFETCH_INTERVAL } from '../../constants'
import { useAppSelector } from '../../redux/hooks'
import { useGetEvents } from '../../services/api-query-hooks'
import { useInterval } from '../../utils/hooks'
import { getMonthBlocks } from '../../utils/time'
import { TEvent } from '../../utils/types'
import {
    AllDaysContainer,
    CalendarCell,
    CalendarDayHeader,
    CalendarRow,
    CalendarTableStyle,
    CalendarTD,
    CalendarTimesTableStyle,
    CALENDAR_DEFAULT_SCROLL_HOUR,
    CellTime,
    CELL_HEIGHT,
    DayAndHeaderContainer,
    DayContainer,
    DayHeaderText,
    TimeAndHeaderContainer,
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

interface WeekCalendarEventsProps {
    date: DateTime
    dayOffset: number
    groups: TEvent[][]
}
const WeekCalendarEvents = ({ date, dayOffset, groups }: WeekCalendarEventsProps): JSX.Element => {
    const tmpDate = date.plus({ days: dayOffset })
    const expandedCalendar = useAppSelector((state) => state.tasks_page.expanded_calendar)
    return (
        <DayAndHeaderContainer>
            {expandedCalendar &&
                <CalendarDayHeader>
                    <DayHeaderText isToday={tmpDate.startOf('day').equals(DateTime.now().startOf('day'))}>{tmpDate.toFormat('ccc dd')}</DayHeaderText>
                </CalendarDayHeader>
            }
            <DayContainer>
                {groups.map((group, index) => (
                    <CollisionGroupColumns key={index} events={group} date={tmpDate} />
                ))}
                <TimeIndicator />
                <CalendarDayTable />
            </DayContainer>
        </DayAndHeaderContainer>
    )
}

interface CalendarEventsProps {
    date: DateTime
    numDays: number
}

export default function CalendarEvents({ date, numDays }: CalendarEventsProps): JSX.Element {
    const eventsContainerRef: Ref<HTMLDivElement> = useRef(null)
    const expandedCalendar = useAppSelector((state) => state.tasks_page.expanded_calendar)

    const monthBlocks = useMemo(() => {
        const blocks = getMonthBlocks(date)
        return blocks.map(block => ({ startISO: block.start.toISO(), endISO: block.end.toISO() }))
    }, [date])
    const events: TEvent[] = []
    const { data: eventPreviousMonth, refetch: refetchPreviousMonth } = useGetEvents(
        monthBlocks[0],
        'calendar'
    )
    const { data: eventsCurrentMonth, refetch: refetchCurrentMonth } = useGetEvents(
        monthBlocks[1],
        'calendar'
    )
    const { data: eventsNextMonth, refetch: refetchNextMonth } = useGetEvents(
        monthBlocks[2],
        'calendar'
    )
    events.push(...eventPreviousMonth ?? [], ...eventsCurrentMonth ?? [], ...eventsNextMonth ?? [])

    useInterval(() => {
        refetchPreviousMonth()
        refetchCurrentMonth()
        refetchNextMonth()
    }, EVENTS_REFETCH_INTERVAL, false)

    useEffect(() => {
        if (eventsContainerRef.current) {
            eventsContainerRef.current.scrollTop = CELL_HEIGHT * (CALENDAR_DEFAULT_SCROLL_HOUR - 1)
        }
    }, [])

    const allGroups: TEvent[][][] = []
    for (let i = 0; i < numDays; i++) {
        const startDate = date.plus({ days: i }).startOf('day')
        const endDate = startDate.endOf('day')
        const eventList = events?.filter(
            (event) =>
                DateTime.fromISO(event.datetime_end) >= startDate && DateTime.fromISO(event.datetime_start) <= endDate
        )
        allGroups.push(findCollisionGroups(eventList ?? []))
    }

    return (
        <AllDaysContainer ref={eventsContainerRef}>
            <TimeAndHeaderContainer>
                {expandedCalendar && <CalendarDayHeader />}
                <TimeContainer>
                    <TimeIndicator />
                    <CalendarTimeTable />
                </TimeContainer>
            </TimeAndHeaderContainer>
            {
                allGroups.map((groups, dayOffset) => <WeekCalendarEvents key={dayOffset} date={date} dayOffset={dayOffset} groups={groups} />)
            }
        </AllDaysContainer>
    )
}
