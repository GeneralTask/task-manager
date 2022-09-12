import { useKeyboardShortcut } from '../../hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { Divider } from '../atoms/SectionDivider'
import GTButton from '../atoms/buttons/GTButton'
import GTIconButton from '../atoms/buttons/GTIconButton'
import { useCalendarContext } from './CalendarContext'
import { DateTime } from 'luxon'
import { useCallback } from 'react'
import styled from 'styled-components'

const PaddedContainer = styled.div`
    padding: ${Spacing._16} ${Spacing._4} ${Spacing._16} ${Spacing._24};
`
const HeaderBodyContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`
const ButtonContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 5px;
`
const HeaderIconsContainer = styled.div`
    display: flex;
    align-items: center;
`
const Title = styled.span`
    color: ${Colors.text.black};
    ${Typography.bodySmall};
`
const TitleBold = styled(Title)<{ purple: boolean }>`
    ${({ purple }) => purple && `color: ${Colors.gtColor.primary};`}
    ${Typography.bold};
`

interface CalendarHeaderProps {
    date: DateTime
    setDate: React.Dispatch<React.SetStateAction<DateTime>>
}
export default function CalendarHeader({ date, setDate }: CalendarHeaderProps) {
    const { showMainHeader, showDateHeader, calendarType, setCalendarType, setIsCollapsed, isCollapsed } =
        useCalendarContext()
    const isCalendarExpanded = calendarType === 'week' && !isCollapsed

    const toggleCalendar = () => {
        if (calendarType === 'week') {
            setCalendarType('day')
            setDate(DateTime.now())
        } else {
            setCalendarType('week')
            setDate(date.minus({ days: date.weekday % 7 }))
        }
    }
    const selectToday = useCallback(() => {
        setDate(isCalendarExpanded ? DateTime.now().minus({ days: DateTime.now().weekday % 7 }) : DateTime.now())
    }, [setDate, isCalendarExpanded])

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
    useKeyboardShortcut('today', selectToday)
    useKeyboardShortcut('nextDate', selectNext)
    useKeyboardShortcut('previousDate', selectPrevious)

    if (!showMainHeader && !showDateHeader) return null
    return (
        <div>
            {showMainHeader && (
                <>
                    <PaddedContainer>
                        <HeaderBodyContainer>
                            <Title>Calendar</Title>
                            <HeaderIconsContainer>
                                <GTIconButton
                                    onClick={toggleCalendar}
                                    icon={calendarType === 'week' ? icons.arrows_in : icons.arrows_out}
                                    size="xSmall"
                                />
                                <GTIconButton
                                    onClick={() => setIsCollapsed(true)}
                                    icon={icons.caret_right}
                                    size="xSmall"
                                />
                            </HeaderIconsContainer>
                        </HeaderBodyContainer>
                    </PaddedContainer>
                    <Divider color={Colors.border.light} />
                </>
            )}
            {showDateHeader && (
                <PaddedContainer>
                    <HeaderBodyContainer>
                        <TitleBold purple={date.hasSame(DateTime.now(), 'day')}>{`${date.toFormat(
                            'ccc, LLL d'
                        )}`}</TitleBold>
                        <ButtonContainer>
                            <GTButton value="Today" onClick={selectToday} size="small" styleType="secondary" />
                            <GTIconButton onClick={selectPrevious} icon={icons.caret_left} size="xSmall" />
                            <GTIconButton onClick={selectNext} icon={icons.caret_right} size="xSmall" />
                        </ButtonContainer>
                    </HeaderBodyContainer>
                </PaddedContainer>
            )}
        </div>
    )
}
