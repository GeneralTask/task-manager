import { DateTime } from 'luxon'
import React, { useCallback } from 'react'
import styled from 'styled-components'
import { Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import { Divider } from '../atoms/SectionDivider'
import { TitleSmall } from '../atoms/title/Title'

export const PaddedContainer = styled.div`
    padding: ${Spacing.padding.medium}px ${Spacing.padding.large}px;
`
export const HeaderMiddleContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`
export const DateDisplay = styled.div`
    font-size: ${Typography.small.fontSize}px;
    font-weight: ${Typography.weight._600.fontWeight};
    color: ${Colors.gray._800};
    text-align: center;
`
export const HoverButton = styled.button<{ main?: boolean }>`
    cursor: pointer;
    height: fit-content;
    width: fit-content;
    border: none;
    border-radius: 50vh;
    padding: 4px 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${(props) => (props.main ? 'white' : 'black')};
    background-color: ${(props) => (props.main ? Colors.purple._1 : 'transparent')};
    &:hover {
        background: ${Colors.purple._2};
    }
`
export const ArrowButton = styled.button`
    cursor: pointer;
    height: fit-content;
    width: fit-content;
    border: none;
    border-radius: 50vh;
    padding: 4px 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: transparent;
    &:hover {
        background: ${Colors.gray._200}} 
    }
`


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
        <div>
            <PaddedContainer>
                <TitleSmall>Calendar</TitleSmall>
            </PaddedContainer>
            <Divider color={Colors.gray._200} />
            <PaddedContainer>
                <HeaderMiddleContainer>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <DateDisplay>{`${date.toFormat('ccc, LLL d')}`}</DateDisplay>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <HoverButton main onClick={() => setDate(DateTime.now())}>
                            Today
                        </HoverButton>
                        <ArrowButton onClick={selectPrevious}>
                            <Icon source={icons.caret_left} size="small"></Icon>
                        </ArrowButton>
                        <ArrowButton onClick={selectNext}>
                            <Icon source={icons.caret_right} size="small"></Icon>
                        </ArrowButton>
                    </div>
                </HeaderMiddleContainer>
            </PaddedContainer>
        </div>
    )
}
