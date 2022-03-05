import { DateTime } from 'luxon'
import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Colors } from '../../styles'

import CalendarEvents from './CalendarEvents'
import CalendarHeader from './CalendarHeader'

const CalendarSidebarContainer = styled.div`
    min-width: 400px;
    height: 100vh;
    background-color: ${Colors.gray._50};
    display: flex;
    flex-direction: column;
`

export default function CalendarSidebar(): JSX.Element {
    const [date, setDate] = useState<DateTime>(DateTime.now())
    const [selectedDateIsToday, setSelectedDateIsToday] = useState<boolean>(true)

    // keep track of when the selected date is supposed to be today
    useEffect(() => {
        setSelectedDateIsToday(date.day === DateTime.now().day)
    }, [date])

    return (
        <CalendarSidebarContainer>
            <CalendarHeader date={date} setDate={setDate} />
            <CalendarEvents date={date} isToday={selectedDateIsToday} showTimes={true} scroll={true} />
        </CalendarSidebarContainer>
    )
}
