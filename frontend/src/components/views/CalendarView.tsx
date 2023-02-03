import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useIdleTimer } from 'react-idle-timer'
import { useLocation } from 'react-router-dom'
import { DateTime } from 'luxon'
import { GOOGLE_CALENDAR_SUPPORTED_TYPE_NAME, SINGLE_SECOND_INTERVAL } from '../../constants'
import { useInterval, usePreviewMode } from '../../hooks'
import useKeyboardShortcut from '../../hooks/useKeyboardShortcut'
import { useEvents } from '../../services/api/events.hooks'
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
import CalendarFooter from '../calendar/CalendarFooter'
import CalendarHeader from '../calendar/CalendarHeader'
import CollapsedCalendarSidebar from '../calendar/CollapsedCalendarSidebar'
import TasksDue from '../calendar/TasksDue'
import TasksDueWeek from '../calendar/TasksDueWeek'

export type TCalendarType = 'day' | 'week'

interface CalendarViewProps {
    initialType: TCalendarType
    initialShowHeader?: boolean
    initialCalendarType?: TCalendarType
    isInitiallyCollapsed?: boolean
    hideContainerShadow?: boolean
    hasLeftBorder?: boolean
    additonalHeaderContent?: React.ReactNode
}
const CalendarView = ({
    initialType,
    initialShowHeader,
    isInitiallyCollapsed,
    hideContainerShadow = false,
    hasLeftBorder = false,
    additonalHeaderContent,
}: CalendarViewProps) => {
    const [showHeader, setShowHeader] = useState<boolean>(initialShowHeader ?? true)
    const timeoutTimer = useIdleTimer({}) // default timeout is 20 minutes
    const {
        date,
        calendarType,
        isCollapsed,
        setDate,
        setCalendarType,
        setIsCollapsed,
        setShowTaskToCalSidebar,
        dayViewDate,
    } = useCalendarContext()
    const monthBlocks = useMemo(() => {
        const blocks = getMonthsAroundDate(date, 1)
        return blocks.map((block) => ({ startISO: block.start.toISO(), endISO: block.end.toISO() }))
    }, [date])
    useEvents(monthBlocks[1], 'calendar')

    const { pathname } = useLocation()
    const isFocusMode = pathname.startsWith('/focus-mode')
    const { isPreviewMode } = usePreviewMode()
    useEffect(() => {
        setCalendarType(initialType)
        if (showHeader !== undefined) setShowHeader(showHeader)
        if (isInitiallyCollapsed !== undefined) setIsCollapsed(isInitiallyCollapsed)
    }, [])

    useInterval(
        () => {
            if (timeoutTimer.isIdle()) {
                if (calendarType === 'day') {
                    setDate(DateTime.now())
                } else {
                    setDate(DateTime.now().minus({ days: DateTime.now().weekday % 7 }))
                }
            }
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
            setDate(dayViewDate)
            setCalendarType('day')
        }, [calendarType, setCalendarType, setIsCollapsed]),
        isFocusMode
    )
    useKeyboardShortcut(
        'showWeeklyCalendar',
        useCallback(() => {
            setIsCollapsed(false)
            setDate(date.minus({ days: date.weekday % 7 }))
            setCalendarType('week')
        }, [calendarType, setCalendarType, setIsCollapsed]),
        isFocusMode
    )
    useKeyboardShortcut(
        'scheduleTasks',
        useCallback(() => {
            setIsCollapsed(false)
            setCalendarType('week')
            setShowTaskToCalSidebar(true)
        }, [calendarType, setCalendarType, setIsCollapsed, setShowTaskToCalSidebar]),
        isFocusMode || !isPreviewMode
    )

    return isCollapsed ? (
        <CollapsedCalendarSidebar onClick={() => setIsCollapsed(false)} />
    ) : (
        <CalendarContainer
            isExpanded={calendarType === 'week'}
            showShadow={!hideContainerShadow}
            hasLeftBorder={hasLeftBorder}
        >
            <CalendarHeader showHeader={showHeader} additionalHeaderContent={additonalHeaderContent} />
            {calendarType === 'day' && <TasksDue date={date} />}
            <CalendarWeekDateHeaderContainer>
                {calendarType === 'week' &&
                    [...Array(7)].map((_, offset) => (
                        <CalendarDayHeader key={offset}>
                            <DayHeaderText
                                isToday={isDateToday(date.plus({ days: offset }))}
                                isPreviewMode={isPreviewMode}
                            >
                                {date.plus({ days: offset }).toFormat('ccc dd')}
                            </DayHeaderText>
                        </CalendarDayHeader>
                    ))}
            </CalendarWeekDateHeaderContainer>
            {calendarType === 'week' && <TasksDueWeek date={date} />}
            <CalendarEvents date={date} primaryAccountID={primaryAccountID} />
            <CalendarFooter />
        </CalendarContainer>
    )
}

export default memo(CalendarView)
