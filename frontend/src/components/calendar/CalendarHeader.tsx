import React, { Dispatch } from 'react'
import styled from 'styled-components'
import { flex } from '../../helpers/styles'

const CalendarHeaderContainer = styled.div`
    height: 50px;
    display: flex;
    justify-content: space-between;
    margin-top: 24px;
    padding: 0px 24px;
`
const DateDisplay = styled.div`
    margin-left: 40px;
    font-size: 24px;
    font-weight: 600;
`

interface CalendarHeaderProps {
    date: Date,
    setDate: Dispatch<Date>
}
export default function CalendarHeader({ date, setDate }: CalendarHeaderProps): JSX.Element {
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' })
    const dayNum = date.getDate()
    const month = date.toLocaleString('default', { month: 'short' })
    return (
        <CalendarHeaderContainer>
            <flex.flex>
                <button>{'|->'}</button>
                <DateDisplay>{`${dayOfWeek}, ${month} ${dayNum}`}</DateDisplay>
            </flex.flex>
            <flex.flex>
                <img src="images/CalendarBlank.svg" alt="Choose a date" />
                <img src="images/CaretLeft.svg" alt="Show previous day" />
                <img src="images/CaretRight.svg" alt="Show next day" />
            </flex.flex>
        </CalendarHeaderContainer>
    )
}
