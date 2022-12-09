import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useIdleTimer } from 'react-idle-timer'
import { useLocation } from 'react-router-dom'
import { DateTime } from 'luxon'
import { GOOGLE_CALENDAR_SUPPORTED_TYPE_NAME, SINGLE_SECOND_INTERVAL } from '../../constants'
import { useInterval, usePreviewMode } from '../../hooks'
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
import TasksDue from '../calendar/TasksDue'
import TasksDueWeek from '../calendar/TasksDueWeek'

export type TCalendarType = 'day' | 'week'

interface CalendarViewProps {
    initialType: TCalendarType
    initialShowMainHeader?: boolean
    initialShowDateHeader?: boolean
    initialCalendarType?: TCalendarType
    isInitiallyCollapsed?: boolean
    hideContainerShadow?: boolean
    hasLeftBorder?: boolean
    additonalHeaderContent?: React.ReactNode
}
const CalendarView = ({
    initialType,
    initialShowMainHeader,
    initialShowDateHeader,
    isInitiallyCollapsed,
    hideContainerShadow = false,
    hasLeftBorder = false,
    additonalHeaderContent,
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
    const { isPreviewMode } = usePreviewMode()

    const { calendarType, isCollapsed, setCalendarType, setIsCollapsed, setShowTaskToCalSidebar } = useCalendarContext()
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
        SINGLE_SECOND_INTERVAL,
        false
    )

    const { data: linkedAccounts } = useGetLinkedAccounts()

    const primaryAccountID = useMemo(
        () =>
            linkedAccounts?.filter((account) => account.name === GOOGLE_CALENDAR_SUPPORTED_TYPE_NAME)?.[0]?.display_id,
        [linkedAccounts]
    )

    useKeyboardShortcut(
        'calendar',
        useCallback(() => setIsCollapsed(!isCollapsed), [isCollapsed, setIsCollapsed]),
        isFocusMode
    )
    useKeyboardShortcut(
        'showDailyCalendar',
        useCallback(() => {
            setIsCollapsed(false)
            setCalendarType('day')
        }, [calendarType, setCalendarType, setIsCollapsed]),
        isFocusMode
    )
    useKeyboardShortcut(
        'showWeeklyCalendar',
        useCallback(() => {
            setIsCollapsed(false)
            setCalendarType('week')
        }, [calendarType, setCalendarType, setIsCollapsed]),
        isFocusMode
    )
    useKeyboardShortcut(
        'scheduleTasks',
        useCallback(() => {
            setShowTaskToCalSidebar(true)
            setIsCollapsed(false)
            setCalendarType('week')
        }, [calendarType, setCalendarType, setIsCollapsed, setShowTaskToCalSidebar]),
        isFocusMode || isPreviewMode
    )

    return isCollapsed ? (
        <CollapsedCalendarSidebar onClick={() => setIsCollapsed(false)} />
    ) : (
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
                additionalHeaderContent={additonalHeaderContent}
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
    )
}

export default memo(CalendarView)
