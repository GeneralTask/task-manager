import {
    AllDaysContainer,
    CALENDAR_DEFAULT_SCROLL_HOUR,
    CELL_HEIGHT_VALUE,
    CalendarCell,
    CalendarDayHeader,
    CalendarRow,
    CalendarTD,
    CalendarTableStyle,
    CalendarTimesTableStyle,
    CellTime,
    DayAndHeaderContainer,
    DayContainer,
    DayHeaderText,
    TimeAndHeaderContainer,
    TimeContainer,
} from './CalendarEvents-styles'
import React, { Ref, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'

import CollisionGroupColumns from './CollisionGroupColumns'
import { DateTime } from 'luxon'
import { CALENDAR_DEFAULT_EVENT_DURATION, EVENTS_REFETCH_INTERVAL } from '../../constants'
import { DropProps, ItemTypes, TEvent } from '../../utils/types'
import { TimeIndicator } from './TimeIndicator'
import { findCollisionGroups } from './utils/eventLayout'
import { getMonthsAroundDate } from '../../utils/time'
import { useAppSelector } from '../../redux/hooks'
import { useCreateEvent, useGetEvents } from '../../services/api-query-hooks'
import useInterval from '../../hooks/useInterval'
import { DropTargetMonitor, useDrop } from 'react-dnd'

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
            const isAmPm = index + 1 <= 12 ? 'am' : 'pm'
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
            {expandedCalendar && (
                <CalendarDayHeader>
                    <DayHeaderText isToday={tmpDate.startOf('day').equals(DateTime.now().startOf('day'))}>
                        {tmpDate.toFormat('ccc dd')}
                    </DayHeaderText>
                </CalendarDayHeader>
            )}
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

const CalendarEvents = ({ date, numDays }: CalendarEventsProps) => {
    const eventsContainerRef: Ref<HTMLDivElement> = useRef(null)
    const expandedCalendar = useAppSelector((state) => state.tasks_page.expanded_calendar)

    const monthBlocks = useMemo(() => {
        const blocks = getMonthsAroundDate(date, 1)
        return blocks.map((block) => ({ startISO: block.start.toISO(), endISO: block.end.toISO() }))
    }, [date])

    const { data: eventPreviousMonth, refetch: refetchPreviousMonth } = useGetEvents(monthBlocks[0], 'calendar')
    const { data: eventsCurrentMonth, refetch: refetchCurrentMonth } = useGetEvents(monthBlocks[1], 'calendar')
    const { data: eventsNextMonth, refetch: refetchNextMonth } = useGetEvents(monthBlocks[2], 'calendar')

    const allGroups = useMemo(() => {
        const events = [...(eventPreviousMonth ?? []), ...(eventsCurrentMonth ?? []), ...(eventsNextMonth ?? [])]
        const allGroups: TEvent[][][] = []
        for (let i = 0; i < numDays; i++) {
            const startDate = date.plus({ days: i }).startOf('day')
            const endDate = startDate.endOf('day')
            const eventList = events?.filter(
                (event) =>
                    DateTime.fromISO(event.datetime_end) >= startDate &&
                    DateTime.fromISO(event.datetime_start) <= endDate
            )
            allGroups.push(findCollisionGroups(eventList ?? []))
        }
        return allGroups
    }, [date, eventPreviousMonth, eventsCurrentMonth, eventsNextMonth])

    useInterval(
        () => {
            refetchPreviousMonth()
            refetchCurrentMonth()
            refetchNextMonth()
        },
        EVENTS_REFETCH_INTERVAL,
        false
    )

    useLayoutEffect(() => {
        if (eventsContainerRef.current) {
            eventsContainerRef.current.scrollTop = CELL_HEIGHT_VALUE * (CALENDAR_DEFAULT_SCROLL_HOUR - 1)
        }
    }, [])

    // drag task to calendar logic

    const { mutate: createEvent } = useCreateEvent()

    const onDrop = useCallback(async (_item: DropProps, monitor: DropTargetMonitor) => {
        const dropPosition = monitor.getClientOffset()
        if (!eventsContainerRef.current || !dropPosition) return
        const eventsContainerOffset = eventsContainerRef.current.getBoundingClientRect().y
        const scrollOffset = eventsContainerRef.current.scrollTop

        const yPosInEventsContainer = dropPosition.y - eventsContainerOffset + scrollOffset

        // index of 30 minute block on the calendar, i.e. 12 am is 0, 12:30 AM is 1, etc.
        const dropTimeBlock = Math.floor(
            yPosInEventsContainer / ((CELL_HEIGHT_VALUE * CALENDAR_DEFAULT_EVENT_DURATION) / 60)
        )

        const start = date.set({
            hour: dropTimeBlock / 2,
            minute: dropTimeBlock % 2 === 0 ? 0 : 30,
            second: 0,
            millisecond: 0,
        })
        const end = start.plus({ minutes: 30 })

        createEvent({
            createEventPayload: {
                account_id: 'scottmai702@gmail.com',
                datetime_start: start.toISO(),
                datetime_end: end.toISO(),
                summary: 'My task',
            },
            date,
        })
    }, [])

    const [_, drop] = useDrop(
        () => ({
            accept: ItemTypes.TASK,
            collect: (monitor) => {
                return !!monitor.isOver()
            },
            drop: onDrop,
        }),
        []
    )

    useEffect(() => {
        drop(eventsContainerRef)
    }, [eventsContainerRef])

    return (
        <AllDaysContainer ref={eventsContainerRef}>
            <TimeAndHeaderContainer>
                {expandedCalendar && <CalendarDayHeader />}
                <TimeContainer>
                    <TimeIndicator />
                    <CalendarTimeTable />
                </TimeContainer>
            </TimeAndHeaderContainer>
            {allGroups.map((groups, dayOffset) => (
                <WeekCalendarEvents key={dayOffset} date={date} dayOffset={dayOffset} groups={groups} />
            ))}
        </AllDaysContainer>
    )
}

export default CalendarEvents
