import { DateTime } from 'luxon'
import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { Colors } from '../../styles'
import CalendarEvents from '../calendar/CalendarEvents'
import CalendarHeader from '../calendar/CalendarHeader'

const CalendarViewContainer = styled.div`
    min-width: 400px;
    height: 100vh;
    background-color: ${Colors.gray._100};
    display: flex;
    flex-direction: column;
`

const CalendarView = () => {
    const [date, setDate] = useState<DateTime>(DateTime.now())
    const [selectedDateIsToday, setSelectedDateIsToday] = useState<boolean>(true)

    // keep track of when the selected date is supposed to be today
    useEffect(() => {
        setSelectedDateIsToday(date.day === DateTime.now().day)
    }, [date])

    return (
        <CalendarViewContainer>
            <CalendarHeader date={date} setDate={setDate} />
            <CalendarEvents date={date} isToday={selectedDateIsToday} />
        </CalendarViewContainer>
    )
}

export default CalendarView
