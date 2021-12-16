import React, { Dispatch } from 'react'
import styled from 'styled-components'

const CalendarHeaderContainer = styled.div`
    height: 50px;
    display: flex;
    justify-content: space-between;
    margin-top: 50px;
    padding: 0px 50px;
`
const DateDisplay = styled.div`
    font-size: 30px;
`
const TodayButton = styled.button`
    height: 37.5px;
    background: inherit;
    border: 1px solid black;
    padding: 0px 10px;
    cursor: pointer;
    border-radius: 10px;
    color: black;
    font-size: 15px;
`

interface CalendarHeaderProps {
    month: string,
    year: number,
    setDate: Dispatch<Date>
}
export default function CalendarHeader({ month, year, setDate }: CalendarHeaderProps): JSX.Element {
    const setDateToday = () => {
        setDate(new Date())
    }
    return (
        <CalendarHeaderContainer>
            <DateDisplay>{`${month} ${year}`}</DateDisplay>
            <TodayButton onClick={setDateToday}>Today</TodayButton>
        </CalendarHeaderContainer>
    )
}
