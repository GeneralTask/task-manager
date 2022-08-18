import { Colors, Spacing } from '../../styles'
import React, { useCallback, useEffect } from 'react'
import { TitleMedium, TitleSmall } from '../atoms/title/Title'
import { DateTime } from 'luxon'
import { Divider } from '../atoms/SectionDivider'
import { Icon } from '../atoms/Icon'
import { icons } from '../../styles/images'
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
    showExpandOptions: boolean
    isExpanded: boolean
    setIsExpanded: (isExpanded: boolean) => void
}
export default function CalendarHeader({
    collapseCalendar,
    date,
    setDate,
    showExpandOptions = true,
    isExpanded,
    setIsExpanded,
}: CalendarHeaderProps): JSX.Element {
    const selectNext = useCallback(
        () =>
            setDate((date) => {
                return date.plus({ days: isExpanded ? 7 : 1 })
            }),
        [date, setDate, isExpanded]
    )
    const selectPrevious = useCallback(
        () =>
            setDate((date) => {
                return date.minus({ days: isExpanded ? 7 : 1 })
            }),
        [date, setDate, isExpanded]
    )
    const expandCalendar = (expanded: boolean) => {
        setIsExpanded(expanded)
        setDate(expanded ? date.minus({ days: date.weekday % 7 }) : DateTime.now())
    }

    useEffect(() => {
        expandCalendar(isExpanded)
    }, [])

    useKeyboardShortcut('nextDate', selectNext)
    useKeyboardShortcut('previousDate', selectPrevious)

    return (
        <div>
            {showExpandOptions && (
                <>
                    <PaddedContainer>
                        <HeaderBodyContainer>
                            <TitleSmall>Calendar</TitleSmall>
                            <HeaderIconsContainer>
                                <ArrowButton onClick={() => expandCalendar(!isExpanded)}>
                                    {isExpanded ? (
                                        <Icon icon={icons.arrows_in} size="xSmall" />
                                    ) : (
                                        <Icon icon={icons.arrows_out} size="xSmall" />
                                    )}
                                </ArrowButton>
                                <CaretButton onClick={() => collapseCalendar()}>
                                    <Icon icon={icons.caret_right} size="xSmall" />
                                </CaretButton>
                            </HeaderIconsContainer>
                        </HeaderBodyContainer>
                    </PaddedContainer>
                    <Divider color={Colors.border.light} />
                </>
            )}
            <PaddedContainer>
                <HeaderBodyContainer>
                    <TitleMedium>{`${date.toFormat('ccc, LLL d')}`}</TitleMedium>
                    <ButtonContainer>
                        <HoverButton
                            onClick={() =>
                                setDate(
                                    isExpanded
                                        ? DateTime.now().minus({ days: DateTime.now().weekday % 7 })
                                        : DateTime.now()
                                )
                            }
                        >
                            Today
                        </HoverButton>
                        <CaretButton onClick={selectPrevious}>
                            <Icon icon={icons.caret_left} size="xSmall" />
                        </CaretButton>
                        <CaretButton onClick={selectNext}>
                            <Icon icon={icons.caret_right} size="xSmall" />
                        </CaretButton>
                    </ButtonContainer>
                </HeaderBodyContainer>
            </PaddedContainer>
        </div>
    )
}
