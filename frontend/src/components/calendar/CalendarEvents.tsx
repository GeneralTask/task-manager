import { useLayoutEffect, useMemo, useRef } from 'react'
import { DateTime } from 'luxon'
import { useGetEvents } from '../../services/api/events.hooks'
import { useGetLinkedAccounts } from '../../services/api/settings.hooks'
import { getMonthsAroundDate, isDateToday } from '../../utils/time'
import { TEvent } from '../../utils/types'
import { isGoogleCalendarLinked } from '../../utils/utils'
import { useCalendarContext } from './CalendarContext'
import {
    AllDaysContainer,
    CALENDAR_DEFAULT_SCROLL_HOUR,
    CELL_HEIGHT_VALUE,
    CalendarCell,
    CalendarRow,
    CalendarTD,
    CalendarTableStyle,
    CalendarTimesTableStyle,
    DayAndHeaderContainer,
    DayContainer,
    DropPreview,
    EVENT_CREATION_INTERVAL_HEIGHT,
    TimeAndHeaderContainer,
    TimeContainer,
} from './CalendarEvents-styles'
import CollisionGroupColumns from './CollisionGroupColumns'
import EventBody from './EventBody'
import { TimeIndicator } from './TimeIndicator'
import { findCollisionGroups } from './utils/eventLayout'
import useCalendarDrop from './utils/useCalendarDrop'

interface CalendarDayTableProps {
    hasBorder: boolean
}
const CalendarDayTable = ({ hasBorder }: CalendarDayTableProps) => {
    const hourElements = Array(24)
        .fill(0)
        .map((_, index) => {
            return (
                <CalendarRow key={index}>
                    <CalendarTD borderLeft={hasBorder} />
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
                        <CalendarCell>{timeString}</CalendarCell>
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
// Gets called in CalendarEvents (down below)
interface WeekCalendarEventsProps {
    date: DateTime
    groups: TEvent[][]
    primaryAccountID: string | undefined
}
const WeekCalendarEvents = ({ date, groups, primaryAccountID }: WeekCalendarEventsProps) => {
    const eventsContainerRef = useRef<HTMLDivElement>(null)
    const { calendarType } = useCalendarContext()
    const isWeekCalendar = calendarType === 'week'
    const { isOver, dropPreviewPosition, eventPreview } = useCalendarDrop({
        primaryAccountID,
        date,
        eventsContainerRef,
        isWeekView: isWeekCalendar,
    })
    const isToday = isDateToday(date)

    return (
        <DayAndHeaderContainer ref={eventsContainerRef}>
            <DayContainer>
                {groups.map((group, index) => (
                    <CollisionGroupColumns key={index} events={group} date={date} />
                ))}
                {isOver &&
                    (eventPreview ? (
                        <EventBody
                            event={eventPreview}
                            leftOffset={0}
                            collisionGroupSize={1}
                            date={date}
                            isBeingDragged
                        />
                    ) : (
                        <DropPreview isVisible={isOver} offset={EVENT_CREATION_INTERVAL_HEIGHT * dropPreviewPosition} />
                    ))}
                {isToday && <TimeIndicator hideDot={!isWeekCalendar} />}
                <CalendarDayTable hasBorder={isWeekCalendar} />
            </DayContainer>
        </DayAndHeaderContainer>
    )
}

const removeDuplicateEvents = (events: TEvent[]) => {
    const uniqueEvents = new Set()
    return events.filter((event) => {
        const isUnique = !uniqueEvents.has(event.id)
        uniqueEvents.add(event.id)
        return isUnique
    })
}

interface CalendarEventsProps {
    date: DateTime
    primaryAccountID: string | undefined
}

const CalendarEvents = ({ date, primaryAccountID }: CalendarEventsProps) => {
    const { data: linkedAccounts, isLoading: isLinkedAccountsLoading } = useGetLinkedAccounts()
    const scrollRef = useRef<HTMLDivElement>(null)
    const timeIndicatorRef = useRef<HTMLDivElement>(null)

    const { calendarType } = useCalendarContext()
    const numberOfDays = calendarType === 'week' ? 7 : 1
    const monthBlocks = useMemo(() => {
        const blocks = getMonthsAroundDate(date, 1)
        return blocks.map((block) => ({ startISO: block.start.toISO(), endISO: block.end.toISO() }))
    }, [date])

    const { data: eventPreviousMonth } = useGetEvents(monthBlocks[0], 'calendar')
    const { data: eventsCurrentMonth } = useGetEvents(monthBlocks[1], 'calendar')
    const { data: eventsNextMonth } = useGetEvents(monthBlocks[2], 'calendar')

    const allGroups = useMemo(() => {
        const events = [...(eventPreviousMonth ?? []), ...(eventsCurrentMonth ?? []), ...(eventsNextMonth ?? [])]
        const uniqueEvents = removeDuplicateEvents(events)
        const allGroups: TEvent[][][] = []
        for (let i = 0; i < numberOfDays; i++) {
            const startDate = date.plus({ days: i }).startOf('day')
            const endDate = startDate.endOf('day')
            const eventList = uniqueEvents?.filter(
                (event) =>
                    DateTime.fromISO(event.datetime_end) >= startDate &&
                    DateTime.fromISO(event.datetime_start) <= endDate
            )
            allGroups.push(findCollisionGroups(eventList ?? []))
        }
        return allGroups
    }, [date, eventPreviousMonth, eventsCurrentMonth, eventsNextMonth, numberOfDays])

    const showOauthPrompt = linkedAccounts !== undefined && !isGoogleCalendarLinked(linkedAccounts)
    useLayoutEffect(() => {
        if (showOauthPrompt && !isLinkedAccountsLoading && scrollRef.current) {
            scrollRef.current.scrollTop = 0
        } else if (scrollRef.current) {
            scrollRef.current.scrollTop = CELL_HEIGHT_VALUE * (CALENDAR_DEFAULT_SCROLL_HOUR - 1)
        }
    }, [linkedAccounts, showOauthPrompt, isLinkedAccountsLoading])

    useLayoutEffect(() => {
        timeIndicatorRef.current?.scrollIntoView({
            behavior: 'auto',
            block: 'center',
            inline: 'center',
        })
    }, [])

    return (
        <AllDaysContainer ref={scrollRef}>
            <TimeAndHeaderContainer>
                <TimeContainer>
                    {isDateToday(date) && calendarType === 'day' && <TimeIndicator ref={timeIndicatorRef} />}
                    <CalendarTimeTable />
                </TimeContainer>
            </TimeAndHeaderContainer>

            {allGroups.map((groups, dayOffset) => (
                <WeekCalendarEvents
                    key={dayOffset}
                    date={date.plus({ days: dayOffset })}
                    groups={groups}
                    primaryAccountID={primaryAccountID}
                />
            ))}
        </AllDaysContainer>
    )
}

export default CalendarEvents
