import { DateTime } from 'luxon'
import React, { useCallback } from 'react'
import {
    CalendarHeaderContainer,
    HoverButton,
    Icon,
    DateDisplay,
    CalendarHeaderTitle,
    HeaderTopContainer,
    HeaderMiddleContainer,
    HeaderBottomContainer,
    ArrowButton,
} from './CalendarHeader-styles'

interface CalendarHeaderProps {
    date: DateTime
    setDate: React.Dispatch<React.SetStateAction<DateTime>>
}
export default function CalendarHeader({ date, setDate }: CalendarHeaderProps): JSX.Element {
    const selectNext = useCallback(
        () =>
            setDate((date) => {
                return date.plus({ days: 1 })
            }),
        [date, setDate]
    )
    const selectPrevious = useCallback(
        () =>
            setDate((date) => {
                return date.minus({ days: 1 })
            }),
        [date, setDate]
    )

    return (
        <CalendarHeaderContainer>
            <HeaderTopContainer>
                <div style={{ display: 'flex' }}>
                    <CalendarHeaderTitle>Calendar</CalendarHeaderTitle>
                </div>
                <div style={{ display: 'flex' }}>
                    <HoverButton onClick={(e) => e.stopPropagation()} style={{ display: 'none' }}>
                        <Icon src={require('../../assets/plus.png')} alt="Add Event" />
                    </HoverButton>
                </div>
            </HeaderTopContainer>
            <HeaderMiddleContainer>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <DateDisplay>{`${date.toFormat('ccc, LLL d')}`}</DateDisplay>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <HoverButton main onClick={() => setDate(DateTime.now())}>
                        Today
                    </HoverButton>
                    <ArrowButton onClick={selectPrevious}>
                        <Icon src={require('../../assets/caret_left.png')} alt="Show previous" />
                    </ArrowButton>
                    <ArrowButton onClick={selectNext}>
                        <Icon src={require('../../assets/caret_right.png')} alt="Show next" />
                    </ArrowButton>
                </div>
            </HeaderMiddleContainer>
            <HeaderBottomContainer></HeaderBottomContainer>
        </CalendarHeaderContainer>
    )
}
