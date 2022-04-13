import { DateTime } from 'luxon'
import React, { useState } from 'react'
import { useIdleTimer } from 'react-idle-timer'

import { useAppSelector } from '../../redux/hooks'
import { useInterval } from '../../utils/hooks'
import CalendarEvents from '../calendar/CalendarEvents'
import { CalendarContainer } from '../calendar/CalendarEvents-styles'
import CalendarHeader from '../calendar/CalendarHeader'

const CalendarView = () => {
    const timeoutTimer = useIdleTimer({}) // default timeout is 20 minutes
    const [date, setDate] = useState<DateTime>(DateTime.now())
    const expandedCalendar = useAppSelector((state) => state.tasks_page.expanded_calendar)
    useInterval(
        () => {
            if (timeoutTimer.isIdle()) setDate(DateTime.now())
        },
        1,
        false
    )
    return (
        <CalendarContainer expanded={expandedCalendar}>
            <CalendarHeader date={date} setDate={setDate} />
            <CalendarEvents date={date} numDays={expandedCalendar ? 7 : 1} />
        </CalendarContainer>
    )
}

export default React.memo(CalendarView)
