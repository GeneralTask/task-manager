import { DateTime } from 'luxon'
import React, { useCallback } from 'react'
import styled from 'styled-components'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { setExpandedCalendar } from '../../redux/tasksPageSlice'
import { Colors, Dimensions, Spacing } from '../../styles'
import { icons } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import { Divider } from '../atoms/SectionDivider'
import { TitleMedium, TitleSmall } from '../atoms/title/Title'

export const PaddedContainer = styled.div`
    padding-top: ${Spacing.padding._16}px;
    padding-right: ${(Dimensions.COLLAPSED_CALENDAR_WIDTH - Dimensions.iconSize.small) / 2}px;
    padding-bottom: ${Spacing.padding._16}px;
    padding-left: ${Spacing.padding._24}px;
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
export const CursorPointerDiv = styled.div`
    display: flex;
    flex-direction: row;
    margin: ${Spacing.margin._4}px;
    cursor: pointer;
    height: fit-content;
    padding: ${Spacing.padding._4}px;
    &:hover {
        background-color: ${Colors.gray._200};
    }
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
const HeaderIconsContainer = styled.div`
    display: flex;
    align-items: center;
`

interface CalendarHeaderProps {
    collapseCalendar: () => void
    date: DateTime
    setDate: React.Dispatch<React.SetStateAction<DateTime>>
}
export default function CalendarHeader({ collapseCalendar, date, setDate }: CalendarHeaderProps): JSX.Element {
    const isCalendarExpanded = useAppSelector((state) => state.tasks_page.expanded_calendar)
    const dispatch = useAppDispatch()
    const selectNext = useCallback(
        () =>
            setDate((date) => {
                return date.plus({ days: isCalendarExpanded ? 7 : 1 })
            }),
        [date, setDate, isCalendarExpanded]
    )
    const selectPrevious = useCallback(
        () =>
            setDate((date) => {
                return date.minus({ days: isCalendarExpanded ? 7 : 1 })
            }),
        [date, setDate, isCalendarExpanded]
    )
    const expandCalendar = (expanded: boolean) => {
        dispatch(setExpandedCalendar(expanded))
        setDate(expanded ? date.minus({ days: date.weekday % 7 }) : DateTime.now())
    }

    return (
        <div>
            <PaddedContainer>
                <HeaderBodyContainer>
                    <TitleSmall>Calendar</TitleSmall>
                    <HeaderIconsContainer>
                        <ArrowButton onClick={() => expandCalendar(!isCalendarExpanded)}>
                            {isCalendarExpanded ? (
                                <Icon source={icons.arrows_in} size="small" />
                            ) : (
                                <Icon source={icons.arrows_out} size="small" />
                            )}
                        </ArrowButton>
                        <CursorPointerDiv onClick={() => collapseCalendar()}>
                            <Icon source={icons.caret_right} size="small" />
                        </CursorPointerDiv>
                    </HeaderIconsContainer>
                </HeaderBodyContainer>
            </PaddedContainer>
            <Divider color={Colors.gray._200} />
            <PaddedContainer>
                <HeaderBodyContainer>
                    <TitleMedium>{`${date.toFormat('ccc, LLL d')}`}</TitleMedium>
                    <ButtonContainer>
                        <HoverButton
                            onClick={() =>
                                setDate(
                                    isCalendarExpanded
                                        ? DateTime.now().minus({ days: DateTime.now().weekday % 7 })
                                        : DateTime.now()
                                )
                            }
                        >
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
