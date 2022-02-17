import { DateTime } from 'luxon'
import React, { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'
import { EVENT_CONTAINER_COLOR } from '../../helpers/styles'
import { dateIsToday, useInterval } from '../../helpers/utils'

import CalendarEvents from './CalendarEvents'
import CalendarHeader from './CalendarHeader'

const CalendarSidebarContainer = styled.div`
    min-width: 400px;
    height: 100%;
    background-color: ${EVENT_CONTAINER_COLOR};
    display: flex;
    flex-direction: column;
`

export default function CalendarSidebar(): JSX.Element {
    const [date, setDate] = useState<DateTime>(DateTime.now())
    const [selectedDateIsToday, setSelectedDateIsToday] = useState<boolean>(true)

    // keep track of when the selected date is supposed to be today
    useEffect(() => {
        setSelectedDateIsToday(dateIsToday(date))
    }, [date])

    // check if the selected date is supposed to be today, but it isn't  (e.g. we passed midnight)
    useInterval(
        useCallback(() => {
            if (selectedDateIsToday && !dateIsToday(date)) {
                setDate(DateTime.now())
            }
        }, [date, selectedDateIsToday]),
        1,
        false
    )

    return (
        <CalendarSidebarContainer>
            <CalendarHeader date={date} setDate={setDate} />
            <CalendarEvents date={date} isToday={selectedDateIsToday} showTimes={true} scroll={true} />
        </CalendarSidebarContainer>
    )
}
