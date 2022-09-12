import { useInterval } from '../../hooks'
import useKeyboardShortcut from '../../hooks/useKeyboardShortcut'
import { useGetEvents } from '../../services/api/events.hooks'
import { useGetLinkedAccounts } from '../../services/api/settings.hooks'
import { getMonthsAroundDate } from '../../utils/time'
import { useCalendarContext } from '../calendar/CalendarContext'
import CalendarEvents from '../calendar/CalendarEvents'
import { CalendarContainer } from '../calendar/CalendarEvents-styles'
import CalendarHeader from '../calendar/CalendarHeader'
import CollapsedCalendarSidebar from '../calendar/CollapsedCalendarSidebar'
import { DateTime } from 'luxon'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useIdleTimer } from 'react-idle-timer'

export type TCalendarType = 'day' | 'week'

interface CalendarViewProps {
    initialType: TCalendarType
    showMainHeader?: boolean
    showDateHeader?: boolean
    isInitiallyCollapsed?: boolean
    showContainerShadow?: boolean
}
const CalendarView = ({
    initialType,
    showMainHeader,
    showDateHeader,
    isInitiallyCollapsed,
    showContainerShadow = true,
}: CalendarViewProps) => {
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

    const primaryAccountID = useMemo(
        () => linkedAccounts?.filter((account) => account.name === 'Google')?.[0]?.display_id,
        [linkedAccounts]
    )

    useKeyboardShortcut(
        'calendar',
        useCallback(() => setIsCollapsed(!isCollapsed), [isCollapsed, setIsCollapsed])
    )

    const { isTaskDraggingOverDetailsView } = useCalendarContext()

    return isCollapsed ? (
        <CollapsedCalendarSidebar onClick={() => setIsCollapsed(false)} />
    ) : (
        <CalendarContainer
            isExpanded={calendarType === 'week'}
            showShadow={isTaskDraggingOverDetailsView && showContainerShadow}
        >
            <CalendarHeader date={date} setDate={setDate} />
            <CalendarEvents date={date} primaryAccountID={primaryAccountID} />
        </CalendarContainer>
    )
}

export default memo(CalendarView)
