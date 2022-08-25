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
    DEFAULT_EVENT_HEIGHT,
} from './CalendarEvents-styles'
import { EVENTS_REFETCH_INTERVAL } from '../../constants'
import { TEvent } from '../../utils/types'
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useGetEvents } from '../../services/api/events.hooks'

import CollisionGroupColumns from './CollisionGroupColumns'
import { DateTime } from 'luxon'
import { TimeIndicator } from './TimeIndicator'
import { findCollisionGroups } from './utils/eventLayout'
import { getMonthsAroundDate } from '../../utils/time'
import { useAppSelector } from '../../redux/hooks'
import useInterval from '../../hooks/useInterval'
import useCalendarDrop from './utils/useCalendarDrop'

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

// WeekCalendarEvents are the events located in each day column
// Gets called in CalendearEvents (down below)
interface WeekCalendarEventsProps {
    date: DateTime
    dayOffset: number
    groups: TEvent[][]
    eventDetailId: string
    setEventDetailId: (id: string) => void
    isScrollDisabled: boolean
    setIsScrollDisabled: (id: boolean) => void
    isEventSelected: boolean
    setIsEventSelected: (id: boolean) => void
    accountId: string | undefined
}
const WeekCalendarEvents = ({
    date,
    dayOffset,
    groups,
    eventDetailId,
    setEventDetailId,
    isScrollDisabled,
    setIsScrollDisabled,
    isEventSelected,
    setIsEventSelected,
    accountId,
}: WeekCalendarEventsProps): JSX.Element => {
    const tmpDate = date.plus({ days: dayOffset })
    const expandedCalendar = useAppSelector((state) => state.tasks_page.expanded_calendar)
    const eventsContainerRef = useRef<HTMLDivElement>(null)
    const { isOver, dropPreviewPosition } = useCalendarDrop({
        accountId,
        date,
        eventsContainerRef,
    })

    useLayoutEffect(() => {
        if (eventsContainerRef.current) {
            eventsContainerRef.current.scrollTop = CELL_HEIGHT_VALUE * (CALENDAR_DEFAULT_SCROLL_HOUR - 1)
        }
    }, [])

    return (
        <DayAndHeaderContainer ref={eventsContainerRef}>
            {expandedCalendar && (
                <CalendarDayHeader>
                    <DayHeaderText isToday={tmpDate.startOf('day').equals(DateTime.now().startOf('day'))}>
                        {tmpDate.toFormat('ccc dd')}
                    </DayHeaderText>
                </CalendarDayHeader>
            )}
            <DayContainer>
                {groups.map((group, index) => (
                    <CollisionGroupColumns
                        key={index}
                        events={group}
                        date={tmpDate}
                        eventDetailId={eventDetailId}
                        setEventDetailId={setEventDetailId}
                        isScrollDisabled={isScrollDisabled}
                        setIsScrollDisabled={setIsScrollDisabled}
                        isEventSelected={isEventSelected}
                        setIsEventSelected={setIsEventSelected}
                    />
                ))}
                <DropPreview
                    isVisible={isOver}
                    offset={DEFAULT_EVENT_HEIGHT * dropPreviewPosition}
                    height={DEFAULT_EVENT_HEIGHT}
                />
                <TimeIndicator />
                <CalendarDayTable />
            </DayContainer>
        </DayAndHeaderContainer>
    )
}

interface CalendarEventsProps {
    date: DateTime
    numDays: number
    accountId: string | undefined
}

const CalendarEvents = ({ date, numDays, accountId }: CalendarEventsProps) => {
    const expandedCalendar = useAppSelector((state) => state.tasks_page.expanded_calendar)

    const monthBlocks = useMemo(() => {
        const blocks = getMonthsAroundDate(date, 1)
        return blocks.map((block) => ({ startISO: block.start.toISO(), endISO: block.end.toISO() }))
    }, [date])

    const { data: eventPreviousMonth, refetch: refetchPreviousMonth } = useGetEvents(monthBlocks[0], 'calendar')
    const { data: eventsCurrentMonth, refetch: refetchCurrentMonth } = useGetEvents(monthBlocks[1], 'calendar')
    const { data: eventsNextMonth, refetch: refetchNextMonth } = useGetEvents(monthBlocks[2], 'calendar')
    const [eventDetailsID, setEventDetailsID] = useState('')
    const [isEventSelected, setIsEventSelected] = useState(false)
    const [isScrollDisabled, setIsScrollDisabled] = useState(false)

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
    }, [date, eventPreviousMonth, eventsCurrentMonth, eventsNextMonth, numDays])

    useInterval(
        () => {
            refetchPreviousMonth()
            refetchCurrentMonth()
            refetchNextMonth()
        },
        EVENTS_REFETCH_INTERVAL,
        false
    )

    return (
        <AllDaysContainer isScrollDisabled={isScrollDisabled}>
            <TimeAndHeaderContainer>
                {expandedCalendar && <CalendarDayHeader />}
                <TimeContainer>
                    <TimeIndicator />
                    <CalendarTimeTable />
                </TimeContainer>
            </TimeAndHeaderContainer>
            {allGroups.map((groups, dayOffset) => (
                <WeekCalendarEvents
                    key={dayOffset}
                    date={date}
                    dayOffset={dayOffset}
                    groups={groups}
                    eventDetailId={eventDetailsID}
                    setEventDetailId={setEventDetailsID}
                    isScrollDisabled={isScrollDisabled}
                    setIsScrollDisabled={setIsScrollDisabled}
                    isEventSelected={isEventSelected}
                    setIsEventSelected={setIsEventSelected}
                    accountId={accountId}
                />
            ))}
        </AllDaysContainer>
    )
}

export default CalendarEvents
