import { DateTime } from 'luxon'
import React, { useCallback } from 'react'
import styled from 'styled-components'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { setExpandedCalendar } from '../../redux/tasksPageSlice'
import { Colors, Spacing } from '../../styles'
import { icons } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import { Divider } from '../atoms/SectionDivider'
import { TitleMedium, TitleSmall } from '../atoms/title/Title'

export const PaddedContainer = styled.div`
    padding: ${Spacing.padding.medium}px ${Spacing.padding.large}px;
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
    padding: ${Spacing.padding.xSmall}px ${Spacing.padding.small}px;
    display: flex;
    align-items: center;
    justify-content: center;
`
export const HoverButton = styled(ButtonStyles)`
    color: ${Colors.white};
    background-color: ${Colors.purple._1};
    &:hover {
        background-color: ${Colors.purple._2};
    }
`
export const ArrowButton = styled(ButtonStyles)`
    background-color: inherit;
    &:hover {
        background-color: ${Colors.gray._200};
    }
`

interface CalendarHeaderProps {
    date: DateTime
    setDate: React.Dispatch<React.SetStateAction<DateTime>>
}
export default function CalendarHeader({ date, setDate }: CalendarHeaderProps): JSX.Element {
    const expandedCalendar = useAppSelector((state) => state.tasks_page.expanded_calendar)
    const dispatch = useAppDispatch()
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
                <HeaderBodyContainer>
                    <TitleSmall>Calendar</TitleSmall>
                    <ArrowButton onClick={() => dispatch(setExpandedCalendar(!expandedCalendar))}>
                        <Icon source={icons.arrows_out} size="small" />
                    </ArrowButton>
                </HeaderBodyContainer>
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
