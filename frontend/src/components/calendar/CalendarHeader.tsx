import { useCallback } from 'react'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { FOCUS_MODE_ROUTE } from '../../constants'
import { useKeyboardShortcut } from '../../hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import NoStyleLink from '../atoms/NoStyleLink'
import { Divider } from '../atoms/SectionDivider'
import GTButton from '../atoms/buttons/GTButton'
import GTIconButton from '../atoms/buttons/GTIconButton'
import { useCalendarContext } from './CalendarContext'

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
    showMainHeader?: boolean
    showDateHeader?: boolean
}
export default function CalendarHeader({
    date,
    setDate,
    showMainHeader = true,
    showDateHeader = true,
}: CalendarHeaderProps) {
    const { calendarType, setCalendarType, setIsCollapsed, isCollapsed } = useCalendarContext()
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
    useKeyboardShortcut('nextDate', selectNext)
    useKeyboardShortcut('previousDate', selectPrevious)

    if (!showMainHeader && !showDateHeader) return null
    return (
        <div>
            {showMainHeader && (
                <>
                    <PaddedContainer>
                        <HeaderBodyContainer>
                            <NoStyleLink to={`/${FOCUS_MODE_ROUTE}`}>
                                <GTButton
                                    icon={icons.headphones}
                                    iconColor="black"
                                    value="Enter Focus Mode"
                                    size="small"
                                    styleType="secondary"
                                />
                            </NoStyleLink>
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
                            <GTButton
                                value="Today"
                                onClick={() =>
                                    setDate(
                                        isCalendarExpanded
                                            ? DateTime.now().minus({ days: DateTime.now().weekday % 7 })
                                            : DateTime.now()
                                    )
                                }
                                size="small"
                                styleType="secondary"
                            />
                            <GTIconButton onClick={selectPrevious} icon={icons.caret_left} size="xSmall" />
                            <GTIconButton onClick={selectNext} icon={icons.caret_right} size="xSmall" />
                        </ButtonContainer>
                    </HeaderBodyContainer>
                </PaddedContainer>
            )}
        </div>
    )
}
