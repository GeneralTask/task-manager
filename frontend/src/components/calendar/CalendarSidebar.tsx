import React, { useState } from 'react'
import styled from 'styled-components'
import CalendarShifter from './CalendarDateShifter'
import CalendarEvents from './CalendarEvents'
import CalendarHeader from './CalendarHeader'

const CalendarSidebarContainer = styled.div`
    min-width: 475px;
    height: 100%;
    background-color: inherit;
    box-shadow: -5px 0px 20px 5px whitesmoke;
    display: flex;
    flex-direction: column;
    overflow: scroll;
`
export default function CalendarSidebar(): JSX.Element {
    const [date, setDate] = useState<Date>(new Date())
    const month = date.toLocaleString('default', { month: 'short' })
    const year = date.getFullYear()

    return (
        <CalendarSidebarContainer>
            <CalendarHeader month={month} year={year} setDate={setDate} />
            <CalendarShifter date={date} setDate={setDate} />
            <CalendarEvents />
        </CalendarSidebarContainer>
    )
}
