import React, { Dispatch } from 'react'
import styled, { css } from 'styled-components'

const CalendarShifterContainer = styled.div`
    height: 40px;
    display: flex;
    justify-content: space-between;
    padding: 0px 50px;
    margin-top: 30px;
`
const Shifter = styled.button`
    width: 30px;
    background-color: #F4F4F4;
    border: none;
    cursor: pointer;
    border-radius: 5px;
    font-weight: bold;
    font-size: 17.5px;
    visibility: hidden;
`
const CenterDateDisplay = styled.div`
    display: flex;
    gap: 5px;
`
const CenterDateStyle = css`
    display: flex;
    justify-content: center;
    flex-direction: column;
    height: 35px;
    width: 35px;
`
const DayStyle = styled.div`
    ${CenterDateStyle}
    color: inherit;
`
const DateStyle = styled.div`
    ${CenterDateStyle}
    color: white;
    background-color: black;
    border-radius: 50%;
    text-align: center;
`
interface CalendarShifterProps {
    date: Date,
    setDate: Dispatch<Date>
}
export default function CalendarShifter({ date, setDate }: CalendarShifterProps): JSX.Element {
    const day = date.toLocaleDateString('en-us', { weekday: 'short' })
    const monthlyDate = date.getDate()

    const decrementDate = () => {
        const newDate = new Date(date.getTime())
        newDate.setDate(date.getDate() - 1)
        setDate(newDate)
    }
    const incrementDate = () => {
        const newDate = new Date(date.getTime())
        newDate.setDate(date.getDate() + 1)
        setDate(newDate)
    }
    return (
        <CalendarShifterContainer>
            <Shifter onClick={() => decrementDate()}>
                &lt;
            </Shifter>
            <CenterDateDisplay>
                <DayStyle>{day}</DayStyle>
                <DateStyle>{monthlyDate}</DateStyle>
            </CenterDateDisplay>
            <Shifter onClick={() => incrementDate()}>
                &gt;
            </Shifter>
        </CalendarShifterContainer >
    )
}
