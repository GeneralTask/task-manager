import { DateTime } from 'luxon'
import React, { useEffect, useState } from 'react'
import { useAppSelector } from '../../redux/hooks'
import CalendarEvents from '../calendar/CalendarEvents'
import { CalendarContainer } from '../calendar/CalendarEvents-styles'
import CalendarHeader from '../calendar/CalendarHeader'

const CalendarView = () => {
    const [date, setDate] = useState<DateTime>(DateTime.now())
    const expandedCalendar = useAppSelector((state) => state.tasks_page.expanded_calendar)

    useEffect(() => {
        setDate(expandedCalendar ? date.minus({ days: date.weekday % 7 }) : DateTime.now())
    }, [expandedCalendar])

    return (
        <CalendarContainer expanded={expandedCalendar}>
            <CalendarHeader date={date} setDate={setDate} />
            <CalendarEvents date={date} numDays={expandedCalendar ? 7 : 1} />
        </CalendarContainer>
    )
}

export default CalendarView
