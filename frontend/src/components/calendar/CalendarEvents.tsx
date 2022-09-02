import React, { Ref, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { DropTargetMonitor, useDrop } from 'react-dnd'
import { CALENDAR_DEFAULT_EVENT_DURATION } from '../../constants'
import { useCreateEvent, useGetEvents } from '../../services/api/events.hooks'
import { DropItem, DropType, TEvent } from '../../utils/types'
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
    CELL_HEIGHT_VALUE,
    DayAndHeaderContainer,
    DayContainer,
    DayHeaderText,
    TimeAndHeaderContainer,
    TimeContainer,
} from './CalendarEvents-styles'

import { DateTime } from 'luxon'
import { getMonthsAroundDate } from '../../utils/time'
import { useCalendarContext } from './CalendarContext'
import CollisionGroupColumns from './CollisionGroupColumns'
import { TimeIndicator } from './TimeIndicator'
import { findCollisionGroups } from './utils/eventLayout'

const CalendarDayTable = () => {
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

const CalendarTimeTable = () => {
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

// WeekCalendarEvents are the events located in each day column
// Gets called in CalendearEvents (down below)
interface WeekCalendarEventsProps {
    date: DateTime
    dayOffset: number
    groups: TEvent[][]
}
const WeekCalendarEvents = ({ date, dayOffset, groups }: WeekCalendarEventsProps) => {
    const tmpDate = date.plus({ days: dayOffset })
    const { calendarType } = useCalendarContext()
    const isWeekCalendar = calendarType === 'week'

    return (
        <DayAndHeaderContainer>
            {isWeekCalendar && (
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
    accountId: string | undefined
}

const CalendarEvents = ({ date, accountId }: CalendarEventsProps) => {
    const eventsContainerRef: Ref<HTMLDivElement> = useRef(null)
    const { calendarType } = useCalendarContext()
    const numberOfDays = calendarType === 'week' ? 7 : 1

    const monthBlocks = useMemo(() => {
        const blocks = getMonthsAroundDate(date, 1)
        return blocks.map((block) => ({ startISO: block.start.toISO(), endISO: block.end.toISO() }))
    }, [date])

    const { data: eventPreviousMonth } = useGetEvents(monthBlocks[0], 'calendar')
    const { data: eventsCurrentMonth } = useGetEvents(monthBlocks[1], 'calendar')
    const { data: eventsNextMonth } = useGetEvents(monthBlocks[2], 'calendar')
    const { mutate: createEvent } = useCreateEvent()
    const { selectedEvent } = useCalendarContext()

    const allGroups = useMemo(() => {
        const events = [...(eventPreviousMonth ?? []), ...(eventsCurrentMonth ?? []), ...(eventsNextMonth ?? [])]
        const allGroups: TEvent[][][] = []
        for (let i = 0; i < numberOfDays; i++) {
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
    }, [date, eventPreviousMonth, eventsCurrentMonth, eventsNextMonth, numberOfDays])

    useLayoutEffect(() => {
        if (eventsContainerRef.current) {
            eventsContainerRef.current.scrollTop = CELL_HEIGHT_VALUE * (CALENDAR_DEFAULT_SCROLL_HOUR - 1)
        }
    }, [])

    // drag task to calendar logic
    const onDrop = useCallback(
        async (item: DropItem, monitor: DropTargetMonitor) => {
            const dropPosition = monitor.getClientOffset()
            if (!eventsContainerRef.current || !dropPosition || !accountId || !item.task) return
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
            let description = item.task.body
            if (description !== '') {
                description += '\n'
            }
            description += '<a href="https://generaltask.com/" __is_owner="true">created by General Task</a>'

            createEvent({
                createEventPayload: {
                    account_id: accountId,
                    datetime_start: start.toISO(),
                    datetime_end: end.toISO(),
                    summary: item.task.title,
                    description: description,
                    task_id: item.task.id,
                },
                date,
                linkedTask: item.task,
            })
        },
        [date, accountId, createEvent]
    )

    const [, drop] = useDrop(
        () => ({
            accept: DropType.TASK,
            collect: (monitor) => {
                return !!monitor.isOver()
            },
            drop: onDrop,
            canDrop: () => accountId !== undefined,
        }),
        [accountId, onDrop]
    )

    useEffect(() => {
        drop(eventsContainerRef)
    }, [eventsContainerRef])

    return (
        <AllDaysContainer ref={eventsContainerRef} isScrollDisabled={selectedEvent != null}>
            <TimeAndHeaderContainer>
                {calendarType == 'week' && <CalendarDayHeader />}
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
