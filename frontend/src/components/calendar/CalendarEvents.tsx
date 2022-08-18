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
    CALENDAR_DAY_HEADER_HEIGHT,
} from './CalendarEvents-styles'
import React, { Ref, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import CollisionGroupColumns from './CollisionGroupColumns'
import { DateTime } from 'luxon'
import { CALENDAR_DEFAULT_EVENT_DURATION, EVENTS_REFETCH_INTERVAL } from '../../constants'
import { DropItem, DropType, TEvent } from '../../utils/types'
import { TimeIndicator } from './TimeIndicator'
import { findCollisionGroups } from './utils/eventLayout'
import { getMonthsAroundDate } from '../../utils/time'
import { useCreateEvent, useGetEvents } from '../../services/api/events.hooks'
import useInterval from '../../hooks/useInterval'
import { DropTargetMonitor, useDrop } from 'react-dnd'
import styled from 'styled-components'
import { Border, Colors } from '../../styles'

const LeDiv = styled.div<{ isOver: boolean; offset: number }>`
    position: absolute;
    width: 100%;
    height: ${CELL_HEIGHT_VALUE / 2}px;
    border: 2px solid ${Colors.gtColor.primary};
    display: ${(props) => (props.isOver ? 'block' : 'none')};
    border-radius: ${Border.radius.medium};
    box-sizing: border-box;
    top: ${(props) => props.offset}px;
    z-index: 1;
`

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
    isExpanded: boolean
    accountId: string
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
    isExpanded,
    accountId,
}: WeekCalendarEventsProps) => {
    const tmpDate = date.plus({ days: dayOffset })
    const eventsContainerRef: Ref<HTMLDivElement> = useRef(null)
    const { mutate: createEvent } = useCreateEvent()

    const [dropItemBlockState, setDropItemBlockState] = useState(0)

    const onDrop = useCallback(
        (item: DropItem, monitor: DropTargetMonitor) => {
            const dropPosition = monitor.getClientOffset()
            if (!eventsContainerRef.current || !dropPosition || !accountId) return
            const eventsContainerOffset = eventsContainerRef.current.getBoundingClientRect().y
            const scrollOffset = eventsContainerRef.current.scrollTop

            const yPosInEventsContainer = dropPosition.y - eventsContainerOffset + scrollOffset

            // index of 30 minute block on the calendar, i.e. 12 am is 0, 12:30 AM is 1, etc.
            const dropTimeBlock = Math.floor(
                (yPosInEventsContainer - CALENDAR_DAY_HEADER_HEIGHT) /
                    ((CELL_HEIGHT_VALUE * CALENDAR_DEFAULT_EVENT_DURATION) / 60)
            )

            const start = date
                .set({
                    hour: dropTimeBlock / 2,
                    minute: dropTimeBlock % 2 === 0 ? 0 : 30,
                    second: 0,
                    millisecond: 0,
                })
                .plus({ days: dayOffset })
            const end = start.plus({ minutes: 30 })

            createEvent({
                createEventPayload: {
                    account_id: accountId,
                    datetime_start: start.toISO(),
                    datetime_end: end.toISO(),
                    summary: item.task?.title,
                    description: item.task?.body,
                },
                date,
            })
        },
        [date, accountId, createEvent]
    )

    const [{ isOver }, drop] = useDrop(
        () => ({
            accept: DropType.TASK,
            collect: (monitor) => {
                return { isOver: monitor.isOver() }
            },
            drop: onDrop,
            canDrop: () => accountId !== undefined,
            hover: (_, monitor) => {
                const dropPosition = monitor.getClientOffset()
                if (!eventsContainerRef.current || !dropPosition || !accountId) return
                const eventsContainerOffset = eventsContainerRef.current.getBoundingClientRect().y
                const scrollOffset = eventsContainerRef.current.scrollTop

                const yPosInEventsContainer = dropPosition.y - eventsContainerOffset + scrollOffset

                // index of 30 minute block on the calendar, i.e. 12 am is 0, 12:30 AM is 1, etc.
                const dropTimeBlock = Math.floor(
                    (yPosInEventsContainer - CALENDAR_DAY_HEADER_HEIGHT) /
                        ((CELL_HEIGHT_VALUE * CALENDAR_DEFAULT_EVENT_DURATION) / 60)
                )
                console.log('hovering over', dayOffset)
                console.log(dropTimeBlock)
                setDropItemBlockState(dropTimeBlock)
            },
        }),
        [accountId, onDrop]
    )

    useLayoutEffect(() => {
        if (!eventsContainerRef.current) return
        eventsContainerRef.current.scrollTop = CELL_HEIGHT_VALUE * (CALENDAR_DEFAULT_SCROLL_HOUR - 1)
    }, [])

    useEffect(() => {
        drop(eventsContainerRef)
    }, [eventsContainerRef, drop])

    return (
        <DayAndHeaderContainer ref={eventsContainerRef}>
            {isExpanded && (
                <CalendarDayHeader>
                    <DayHeaderText isToday={tmpDate.startOf('day').equals(DateTime.now().startOf('day'))}>
                        {tmpDate.toFormat('ccc dd')}
                    </DayHeaderText>
                </CalendarDayHeader>
            )}
            <DayContainer>
                <LeDiv isOver={isOver} offset={(CELL_HEIGHT_VALUE / 2) * dropItemBlockState}></LeDiv>

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
    isExpanded: boolean
}

const CalendarEvents = ({ date, numDays, accountId, isExpanded }: CalendarEventsProps) => {
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

    // Passing CalendarEvent props (eventdetails) to WeekCalendarEvents
    return (
        <AllDaysContainer isScrollDisabled={isScrollDisabled}>
            <TimeAndHeaderContainer>
                {isExpanded && <CalendarDayHeader />}
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
                    isExpanded={isExpanded}
                    accountId={accountId ?? ''}
                />
            ))}
        </AllDaysContainer>
    )
}

export default CalendarEvents
