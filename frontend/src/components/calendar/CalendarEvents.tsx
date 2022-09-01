import React, { Ref, useLayoutEffect, useMemo, useRef } from 'react'
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
    DropPreview,
    EVENT_CREATION_INTERVAL_HEIGHT,
} from './CalendarEvents-styles'
import { TEvent } from '../../utils/types'
import { useCreateEvent, useGetEvents } from '../../services/api/events.hooks'

import CollisionGroupColumns from './CollisionGroupColumns'
import { DateTime } from 'luxon'
import { TimeIndicator } from './TimeIndicator'
import { findCollisionGroups } from './utils/eventLayout'
import { getMonthsAroundDate } from '../../utils/time'
import { useCalendarContext } from './CalendarContext'
import useCalendarDrop from './utils/useCalendarDrop'

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
    accountId: string | undefined
}
const WeekCalendarEvents = ({ date, dayOffset, groups, accountId }: WeekCalendarEventsProps) => {
    const eventsContainerRef = useRef<HTMLDivElement>(null)
    const tmpDate = date.plus({ days: dayOffset })
    const { calendarType } = useCalendarContext()
    const { isOver, dropPreviewPosition } = useCalendarDrop({
        accountId,
        date,
        eventsContainerRef,
    })
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
                <DropPreview isVisible={isOver} offset={EVENT_CREATION_INTERVAL_HEIGHT * dropPreviewPosition} />
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
    const { calendarType, selectedEvent } = useCalendarContext()
    const numberOfDays = calendarType === 'week' ? 7 : 1

    const monthBlocks = useMemo(() => {
        const blocks = getMonthsAroundDate(date, 1)
        return blocks.map((block) => ({ startISO: block.start.toISO(), endISO: block.end.toISO() }))
    }, [date])

    const { data: eventPreviousMonth } = useGetEvents(monthBlocks[0], 'calendar')
    const { data: eventsCurrentMonth } = useGetEvents(monthBlocks[1], 'calendar')
    const { data: eventsNextMonth } = useGetEvents(monthBlocks[2], 'calendar')
    const { mutate: createEvent } = useCreateEvent()

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
                <WeekCalendarEvents key={dayOffset} date={date} dayOffset={dayOffset} groups={groups} accountId={accountId} />
            ))}
        </AllDaysContainer>
    )
}

export default CalendarEvents
