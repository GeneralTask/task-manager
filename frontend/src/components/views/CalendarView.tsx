import CalendarHeader from '../calendar/CalendarHeader'
import React, { useEffect, useMemo, useState } from 'react'

import { CalendarContainer } from '../calendar/CalendarEvents-styles'
import CalendarEvents from '../calendar/CalendarEvents'
import { DateTime } from 'luxon'
import { getMonthsAroundDate } from '../../utils/time'
import { useGetLinkedAccounts } from '../../services/api/settings.hooks'
import { useGetEvents } from '../../services/api/events.hooks'
import { useIdleTimer } from 'react-idle-timer'
import { useInterval } from '../../hooks'
import useKeyboardShortcut from '../../hooks/useKeyboardShortcut'
import { useCalendarContext } from '../calendar/CalendarContext'
import CollapsedCalendarSidebar from '../calendar/CollapsedCalendarSidebar'

export type TCalendarType = 'day' | 'week'

interface CalendarViewProps {
    initialType: TCalendarType
    showMainHeader?: boolean
    showDateHeader?: boolean
    isInitiallyCollapsed?: boolean
}
const CalendarView = ({ initialType, showMainHeader, showDateHeader, isInitiallyCollapsed }: CalendarViewProps) => {
    const timeoutTimer = useIdleTimer({}) // default timeout is 20 minutes
    const [date, setDate] = useState<DateTime>(DateTime.now())
    const monthBlocks = useMemo(() => {
        const blocks = getMonthsAroundDate(date, 1)
        return blocks.map((block) => ({ startISO: block.start.toISO(), endISO: block.end.toISO() }))
    }, [date])
    useGetEvents(monthBlocks[1], 'calendar')

    const { calendarType, isCollapsed, setCalendarType, setIsCollapsed, setShowMainHeader, setShowDateHeader } =
        useCalendarContext()
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

    const firstLinkedCalendarAccount = useMemo(
        () => linkedAccounts?.filter((account) => account.name === 'Google')?.[0]?.display_id,
        [linkedAccounts]
    )

    useKeyboardShortcut('calendar', () => setIsCollapsed(!isCollapsed))

    return isCollapsed ? (
        <CollapsedCalendarSidebar onClick={() => setIsCollapsed(false)} />
    ) : (
        <CalendarContainer expanded={calendarType === 'week'}>
            <CalendarHeader date={date} setDate={setDate} />
            <CalendarEvents date={date} accountId={firstLinkedCalendarAccount} />
        </CalendarContainer>
    )
}

export default React.memo(CalendarView)
