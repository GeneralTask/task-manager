import CalendarHeader, { CursorPointerDiv } from '../calendar/CalendarHeader'
import { Colors, Spacing } from '../../styles'
import React, { useMemo, useState } from 'react'

import { CalendarContainer } from '../calendar/CalendarEvents-styles'
import CalendarEvents from '../calendar/CalendarEvents'
import { DateTime } from 'luxon'
import { Icon } from '../atoms/Icon'
import { getMonthsAroundDate } from '../../utils/time'
import { icons } from '../../styles/images'
import { setExpandedCalendar } from '../../redux/tasksPageSlice'
import styled from 'styled-components'
import { useAppDispatch } from '../../redux/hooks'
import { useGetEvents, useGetLinkedAccounts } from '../../services/api-query-hooks'
import { useIdleTimer } from 'react-idle-timer'
import { useInterval } from '../../hooks'

const CollapsedCalendarView = styled.div`
    padding-top: ${Spacing.padding._16};
    padding-right: ${Spacing.padding._4};
    background-color: ${Colors.gray._100};
    display: flex;
    justify-content: center;
    cursor: pointer;
`

interface CalendarViewProps {
    isExpanded: boolean
}
const CalendarView = ({ isExpanded }: CalendarViewProps) => {
    const timeoutTimer = useIdleTimer({}) // default timeout is 20 minutes
    const [date, setDate] = useState<DateTime>(DateTime.now())
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

    const { data: linkedAccounts } = useGetLinkedAccounts()

    const firstLinkedCalendarAccount = useMemo(
        () => linkedAccounts?.filter((account) => account.name === 'Google')?.[0]?.display_id,
        [linkedAccounts]
    )
    console.log({ firstLinkedCalendarAccount })

    return isCalendarCollapsed ? (
        <CollapsedCalendarView onClick={() => setIsCalendarCollapsed(false)}>
            <CursorPointerDiv>
                <Icon source={icons.caret_left} size="small" />
            </CursorPointerDiv>
        </CollapsedCalendarView>
    ) : (
        <CalendarContainer expanded={isExpanded}>
            <CalendarHeader collapseCalendar={handleCollapseCalendar} date={date} setDate={setDate} />
            <CalendarEvents date={date} numDays={isExpanded ? 7 : 1} accountId={firstLinkedCalendarAccount} />
        </CalendarContainer>
    )
}

export default React.memo(CalendarView)
