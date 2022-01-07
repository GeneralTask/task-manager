import React, { useCallback } from 'react'
import styled from 'styled-components'
import { flex, ICON_HOVER } from '../../helpers/styles'

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
const HoverButton = styled.button`
    background-color: transparent;
    cursor: pointer;
    height: fit-content;
    width: fit-content;
    border: none;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    &:hover {
        background: ${ICON_HOVER};
    }
`
const Icon = styled.img`
    height: 28px;
    width: 28px;
`

interface CalendarHeaderProps {
    date: Date,
    setDate: React.Dispatch<React.SetStateAction<Date>>
}
export default function CalendarHeader({ date, setDate }: CalendarHeaderProps): JSX.Element {
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' })
    const dayNum = date.getDate()
    const month = date.toLocaleString('default', { month: 'short' })

    const selectNextDay = useCallback(() => setDate(date => {
        const newDate = new Date(date)
        newDate.setDate(date.getDate() + 1)
        return newDate
    }), [date, setDate])
    const selectPreviousDay = useCallback(() => setDate(date => {
        const newDate = new Date(date)
        newDate.setDate(date.getDate() - 1)
        return newDate
    }), [date, setDate])

    return (
        <CalendarHeaderContainer>
            <flex.flex>
                <HoverButton><Icon src="images/collapse.svg" alt="Collapse calendar" /></HoverButton>
                <DateDisplay>{`${dayOfWeek}, ${month} ${dayNum}`}</DateDisplay>
            </flex.flex>
            <flex.flex>
                <HoverButton onClick={() => setDate(new Date())}>
                    <Icon src="images/CalendarBlank.svg" alt="Today" />
                </HoverButton>
                <HoverButton onClick={selectPreviousDay}>
                    <Icon src="images/CaretLeft.svg" alt="Show previous day" />
                </HoverButton>
                <HoverButton onClick={selectNextDay}>
                    <Icon src="images/CaretRight.svg" alt="Show next day" />
                </HoverButton>
            </flex.flex>
        </CalendarHeaderContainer>
    )
}
