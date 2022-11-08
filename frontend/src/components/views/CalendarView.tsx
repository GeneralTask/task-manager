import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useIdleTimer } from 'react-idle-timer'
import { useLocation } from 'react-router-dom'
import { DateTime } from 'luxon'
import { GOOGLE_CALENDAR_SUPPORTED_TYPE_NAME } from '../../constants'
import { useInterval } from '../../hooks'
import useKeyboardShortcut from '../../hooks/useKeyboardShortcut'
import { useGetEvents } from '../../services/api/events.hooks'
import { useGetLinkedAccounts } from '../../services/api/settings.hooks'
import { getMonthsAroundDate, isDateToday } from '../../utils/time'
import { useCalendarContext } from '../calendar/CalendarContext'
import CalendarEvents from '../calendar/CalendarEvents'
import {
    CalendarContainer,
    CalendarDayHeader,
    CalendarWeekDateHeaderContainer,
    DayHeaderText,
} from '../calendar/CalendarEvents-styles'
import CalendarHeader from '../calendar/CalendarHeader'
import CollapsedCalendarSidebar from '../calendar/CollapsedCalendarSidebar'
import SelectedCalendarRanges from '../calendar/SelectedCalendarRanges'
import TasksDue from '../calendar/TasksDue'
import TasksDueWeek from '../calendar/TasksDueWeek'
import useCalendarDrop from '../calendar/utils/useCalendarDrop'

export type TCalendarType = 'day' | 'week'

interface CalendarViewProps {
    initialType: TCalendarType
    initialShowMainHeader?: boolean
    initialShowDateHeader?: boolean
    isInitiallyCollapsed?: boolean
    hideContainerShadow?: boolean
    hasLeftBorder?: boolean
}
const CalendarView = ({
    initialType,
    initialShowMainHeader,
    initialShowDateHeader,
    isInitiallyCollapsed,
    hideContainerShadow = false,
    hasLeftBorder = false,
}: CalendarViewProps) => {
    const [showMainHeader, setShowMainHeader] = useState<boolean>(initialShowMainHeader ?? true)
    const [showDateHeader, setShowDateHeader] = useState<boolean>(initialShowDateHeader ?? true)
    const timeoutTimer = useIdleTimer({}) // default timeout is 20 minutes
    const [dayViewDate, setDayViewDate] = useState<DateTime>(DateTime.now())
    const [date, setDate] = useState<DateTime>(DateTime.now())
    const monthBlocks = useMemo(() => {
        const blocks = getMonthsAroundDate(date, 1)
        return blocks.map((block) => ({ startISO: block.start.toISO(), endISO: block.end.toISO() }))
    }, [date])
    useGetEvents(monthBlocks[1], 'calendar')

    const { pathname } = useLocation()
    const isFocusMode = pathname.startsWith('/focus-mode')

    const { calendarType, isCollapsed, setCalendarType, setIsCollapsed } = useCalendarContext()
    useEffect(() => {
        setCalendarType(initialType)
        if (showMainHeader !== undefined) setShowMainHeader(showMainHeader)
        if (showDateHeader !== undefined) setShowDateHeader(showDateHeader)
        if (isInitiallyCollapsed !== undefined) setIsCollapsed(isInitiallyCollapsed)
    }, [])

    useInterval(
        () => {
            if (timeoutTimer.isIdle()) setDate(DateTime.now())
        },
        1,
        false
    )

    const { data: linkedAccounts } = useGetLinkedAccounts()

    const primaryAccountID = useMemo(
        () =>
            linkedAccounts?.filter((account) => account.name === GOOGLE_CALENDAR_SUPPORTED_TYPE_NAME)?.[0]?.display_id,
        [linkedAccounts]
    )
    const dummyRef = useRef<HTMLDivElement>(null)
    const { selectedTimes } = useCalendarDrop({
        primaryAccountID,
        date,
        eventsContainerRef: dummyRef,
        isWeekView: true,
    })

    useEffect(() => {
        console.log(selectedTimes)
    }, [selectedTimes])

    useKeyboardShortcut(
        'calendar',
        useCallback(() => setIsCollapsed(!isCollapsed), [isCollapsed, setIsCollapsed]),
        isFocusMode
    )

    return isCollapsed ? (
        <CollapsedCalendarSidebar onClick={() => setIsCollapsed(false)} />
    ) : (
        <>
            <CalendarContainer
                isExpanded={calendarType === 'week'}
                showShadow={!hideContainerShadow}
                hasLeftBorder={hasLeftBorder}
            >
                <CalendarHeader
                    date={date}
                    setDate={setDate}
                    dayViewDate={dayViewDate}
                    setDayViewDate={setDayViewDate}
                    showMainHeader={showMainHeader}
                    showDateHeader={showDateHeader}
                />
                {calendarType === 'day' && <TasksDue date={date} />}
                <CalendarWeekDateHeaderContainer>
                    {calendarType === 'week' &&
                        [...Array(7)].map((_, offset) => (
                            <CalendarDayHeader key={offset}>
                                <DayHeaderText isToday={isDateToday(date.plus({ days: offset }))}>
                                    {date.plus({ days: offset }).toFormat('ccc dd')}
                                </DayHeaderText>
                            </CalendarDayHeader>
                        ))}
                </CalendarWeekDateHeaderContainer>
                {calendarType === 'week' && <TasksDueWeek date={date} />}

                <CalendarEvents date={date} primaryAccountID={primaryAccountID} />
            </CalendarContainer>
            {primaryAccountID && selectedTimes?.size !== 0 && (
                <SelectedCalendarRanges primaryAccountID={primaryAccountID} date={date} />
            )}
        </>
    )
}

export default memo(CalendarView)
