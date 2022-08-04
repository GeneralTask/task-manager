import { Colors, Spacing } from '../../styles'
import React, { useCallback } from 'react'
import { TitleMedium, TitleSmall } from '../atoms/title/Title'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { DateTime } from 'luxon'
import { Divider } from '../atoms/SectionDivider'
import { Icon } from '../atoms/Icon'
import { icons } from '../../styles/images'
import { setExpandedCalendar } from '../../redux/tasksPageSlice'
import styled from 'styled-components'
import { useKeyboardShortcut } from '../../hooks'

export const PaddedContainer = styled.div`
    padding: ${Spacing.padding._16} ${Spacing.padding._4} ${Spacing.padding._16} ${Spacing.padding._24};
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
    margin: ${Spacing.margin._4};
    cursor: pointer;
    height: fit-content;
    padding: ${Spacing.padding._4};
    &:hover {
        background-color: ${Colors.background.dark};
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
    color: ${Colors.text.white};
    background-color: ${Colors.gtColor.primary};
    padding: ${Spacing.padding._4} ${Spacing.padding._8};
    &:hover {
        background-color: ${Colors.gtColor.secondary};
    }
`
export const ArrowButton = styled(ButtonStyles)`
    background-color: inherit;
    padding: ${Spacing.padding._4};
    &:hover {
        background-color: ${Colors.background.dark};
    }
`

export const CaretButton = styled(ButtonStyles)`
    background-color: inherit;
    padding: ${Spacing.padding._4};
    &:hover {
        background-color: ${Colors.background.dark};
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

    useKeyboardShortcut('nextDate', selectNext)
    useKeyboardShortcut('previousDate', selectPrevious)

    return (
        <div>
            <PaddedContainer>
                <HeaderBodyContainer>
                    <TitleSmall>Calendar</TitleSmall>
                    <HeaderIconsContainer>
                        <ArrowButton onClick={() => expandCalendar(!isCalendarExpanded)}>
                            {isCalendarExpanded ? (
                                <Icon icon={icons.arrows_in} size="small" />
                            ) : (
                                <Icon icon={icons.arrows_out} size="small" />
                            )}
                        </ArrowButton>
                        <CaretButton onClick={() => collapseCalendar()}>
                            <Icon icon={icons.caret_right} size="small" />
                        </CaretButton>
                    </HeaderIconsContainer>
                </HeaderBodyContainer>
            </PaddedContainer>
            <Divider />
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
                        <CaretButton onClick={selectPrevious}>
                            <Icon icon={icons.caret_left} size="small" />
                        </CaretButton>
                        <CaretButton onClick={selectNext}>
                            <Icon icon={icons.caret_right} size="small" />
                        </CaretButton>
                    </ButtonContainer>
                </HeaderBodyContainer>
            </PaddedContainer>
        </div>
    )
}
