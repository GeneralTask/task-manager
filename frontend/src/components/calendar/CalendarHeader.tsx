import { Colors, Spacing } from '../../styles'
import React, { useCallback } from 'react'
import { TitleMedium, TitleSmall } from '../atoms/title/Title'

import { DateTime } from 'luxon'
import { Divider } from '../atoms/SectionDivider'
import { Icon } from '../atoms/Icon'
import { icons } from '../../styles/images'
import styled from 'styled-components'

export const PaddedContainer = styled.div`
    padding: ${Spacing.padding._16}px ${Spacing.padding._24}px;
`
export const HeaderBodyContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`
export const ButtonContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 5px;
`
const ButtonStyles = styled.button`
    cursor: pointer;
    height: fit-content;
    width: fit-content;
    border: none;
    border-radius: 50vh;
    padding: 0px;
    display: flex;
    align-items: center;
    justify-content: center;
`
export const HoverButton = styled(ButtonStyles)`
    color: ${Colors.white};
    background-color: ${Colors.purple._1};
    padding: ${Spacing.padding._4}px ${Spacing.padding._8}px;
    &:hover {
        background-color: ${Colors.purple._2};
    }
`
export const ArrowButton = styled(ButtonStyles)`
    background-color: inherit;
    padding: ${Spacing.padding._4}px;
    &:hover {
        background-color: ${Colors.gray._200};
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
                <HeaderBodyContainer>
                    <TitleMedium>{`${date.toFormat('ccc, LLL d')}`}</TitleMedium>
                    <ButtonContainer>
                        <HoverButton onClick={() => setDate(DateTime.now())}>
                            Today
                        </HoverButton>
                        <ArrowButton onClick={selectPrevious}>
                            <Icon source={icons.caret_left} size="small" />
                        </ArrowButton>
                        <ArrowButton onClick={selectNext}>
                            <Icon source={icons.caret_right} size="small" />
                        </ArrowButton>
                    </ButtonContainer>
                </HeaderBodyContainer>
            </PaddedContainer>
        </div>
    )
}
