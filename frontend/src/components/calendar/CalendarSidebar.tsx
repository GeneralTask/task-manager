import React, { useCallback, useEffect, useState } from 'react'
import { dateIsToday, useInterval } from '../../helpers/utils'

import CalendarEvents from './CalendarEvents'
import CalendarHeader from './CalendarHeader'
import { CalendarSidebarContainer } from './CalendarHeader-styles'

export default function CalendarSidebar(): JSX.Element {
    const [date, setDate] = useState<Date>(new Date())
    const [selectedDateIsToday, setSelectedDateIsToday] = useState<boolean>(true)

    // keep track of when the selected date is supposed to be today
    useEffect(() => {
        setSelectedDateIsToday(dateIsToday(date))
    }, [date])

    // check if the selected date is supposed to be today, but it isn't  (e.g. we passed midnight)
    useInterval(useCallback(() => {
        if (selectedDateIsToday && !dateIsToday(date)) {
            setDate(new Date())
        }
    }, [date, selectedDateIsToday]), 1, false)

    return (
        <CalendarSidebarContainer>
            <CalendarHeader date={date} setDate={setDate} />
            <CalendarEvents date={date} isToday={selectedDateIsToday} />
        </CalendarSidebarContainer>
    )
}
