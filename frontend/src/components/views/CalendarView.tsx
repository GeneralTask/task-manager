import { DateTime } from 'luxon'
import React, { useMemo, useState } from 'react'
import { useIdleTimer } from 'react-idle-timer'

import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { useInterval } from '../../hooks'
import CalendarEvents from '../calendar/CalendarEvents'
import { CalendarContainer } from '../calendar/CalendarEvents-styles'
import CalendarHeader, { CursorPointerDiv } from '../calendar/CalendarHeader'
import styled from 'styled-components'
import { Icon } from '../atoms/Icon'
import { icons } from '../../styles/images'
import { Colors, Spacing } from '../../styles'
import { setExpandedCalendar } from '../../redux/tasksPageSlice'
import { useGetEvents } from '../../services/api-query-hooks'
import { getMonthsAroundDate } from '../../utils/time'

const CollapsedCalendarView = styled.div`
    padding-top: ${Spacing.padding._16}px;
    padding-right: ${Spacing.padding._4}px;
    background-color: ${Colors.gray._100};
    display: flex;
    justify-content: center;
    cursor: pointer;
`

const CalendarView = () => {
    const timeoutTimer = useIdleTimer({}) // default timeout is 20 minutes
    const [date, setDate] = useState<DateTime>(DateTime.now())
    const expandedCalendar = useAppSelector((state) => state.tasks_page.expanded_calendar)
    const monthBlocks = useMemo(() => {
        const blocks = getMonthsAroundDate(date, 1)
        return blocks.map((block) => ({ startISO: block.start.toISO(), endISO: block.end.toISO() }))
    }, [date])
    useGetEvents(monthBlocks[1], 'calendar')

    const [isCalendarCollapsed, setIsCalendarCollapsed] = useState(true)
    const dispatch = useAppDispatch()

    const handleCollapseCalendar = () => {
        dispatch(setExpandedCalendar(false))
        setIsCalendarCollapsed(true)
    }

    useInterval(
        () => {
            if (timeoutTimer.isIdle()) setDate(DateTime.now())
        },
        1,
        false
    )
    return isCalendarCollapsed ? (
        <CollapsedCalendarView onClick={() => setIsCalendarCollapsed(false)}>
            <CursorPointerDiv>
                <Icon source={icons.caret_left} size="small" />
            </CursorPointerDiv>
        </CollapsedCalendarView>
    ) : (
        <CalendarContainer expanded={expandedCalendar}>
            <CalendarHeader collapseCalendar={handleCollapseCalendar} date={date} setDate={setDate} />
            <CalendarEvents date={date} numDays={expandedCalendar ? 7 : 1} />
        </CalendarContainer>
    )
}

export default React.memo(CalendarView)
