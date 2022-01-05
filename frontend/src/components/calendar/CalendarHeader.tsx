import React, { useCallback } from 'react'
import { flex } from '../../helpers/styles'
import ExpandCollapse from '../common/ExpandCollapse'
import { CalendarHeaderContainer, HoverButton, Icon, DateDisplay } from './CalendarHeader-styles'

interface CalendarHeaderProps {
    date: Date,
    setDate: React.Dispatch<React.SetStateAction<Date>>,
    setIsShown: (b: boolean) => void,
}
export default function CalendarHeader({ date, setDate, setIsShown }: CalendarHeaderProps): JSX.Element {
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
                <ExpandCollapse direction="right" onClick={() => setIsShown(false)} />
                <DateDisplay>{`${dayOfWeek}, ${month} ${dayNum}`}</DateDisplay>
            </flex.flex>
            <flex.flex>
                <HoverButton><Icon src="images/CalendarBlank.svg" alt="Choose a date" /></HoverButton>
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
