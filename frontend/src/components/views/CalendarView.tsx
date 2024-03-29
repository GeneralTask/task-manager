import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useIdleTimer } from 'react-idle-timer'
import { useLocation } from 'react-router-dom'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { SINGLE_SECOND_INTERVAL } from '../../constants'
import { useInterval, usePreviewMode } from '../../hooks'
import useKeyboardShortcut from '../../hooks/useKeyboardShortcut'
import { useEvents } from '../../services/api/events.hooks'
import { useGetLinkedAccounts } from '../../services/api/settings.hooks'
import { getMonthsAroundDate, isDateToday } from '../../utils/time'
import { isGoogleCalendarLinked } from '../../utils/utils'
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
import EnableCalendarsBanner from '../calendar/EnableCalendarsBanner'
import TasksDue from '../calendar/TasksDue'
import TasksDueWeek from '../calendar/TasksDueWeek'
import ConnectIntegration from '../molecules/ConnectIntegration'

export type TCalendarType = 'day' | 'week'

const ConnectContainer = styled.div`
    width: 100%;
    z-index: 100;
`

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

    useKeyboardShortcut(
        'calendar',
        useCallback(() => setIsCollapsed(!isCollapsed), [isCollapsed, setIsCollapsed]),
        isFocusMode
    )
    useKeyboardShortcut(
        'toggleDailyCalendar',
        useCallback(() => {
            if (calendarType === 'day' && !isCollapsed) {
                setIsCollapsed(true)
            } else {
                setIsCollapsed(false)
                setDate(dayViewDate)
                setCalendarType('day')
            }
        }, [calendarType, dayViewDate, setCalendarType, setIsCollapsed]),
        isFocusMode
    )
    useKeyboardShortcut(
        'toggleWeeklyCalendar',
        useCallback(() => {
            if (calendarType === 'week' && !isCollapsed) {
                setIsCollapsed(true)
            } else {
                setIsCollapsed(false)
                setDate(date.minus({ days: date.weekday % 7 }))
                setCalendarType('week')
            }
        }, [calendarType, dayViewDate, setCalendarType, setIsCollapsed]),
        isFocusMode
    )
    useKeyboardShortcut(
        'scheduleTasks',
        useCallback(() => {
            setIsCollapsed(false)
            setCalendarType('week')
            setShowTaskToCalSidebar(true)
        }, [calendarType, setCalendarType, setIsCollapsed, setShowTaskToCalSidebar]),
        isFocusMode
    )

    const showOauthPrompt = linkedAccounts !== undefined && !isGoogleCalendarLinked(linkedAccounts)

    return isCollapsed ? (
        <CollapsedCalendarSidebar onClick={() => setIsCollapsed(false)} />
    ) : (
        <CalendarContainer
            isExpanded={calendarType === 'week'}
            showShadow={!hideContainerShadow}
            hasLeftBorder={hasLeftBorder}
        >
            <CalendarHeader showHeader={showHeader} additionalHeaderContent={additonalHeaderContent} />
            <ConnectContainer>
                {showOauthPrompt && <ConnectIntegration type="google_calendar" />}
                <EnableCalendarsBanner />
            </ConnectContainer>
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
            <CalendarEvents date={date} />
            <CalendarFooter />
        </CalendarContainer>
    )
}

export default memo(CalendarView)
