import { useCallback } from 'react'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { FOCUS_MODE_ROUTE } from '../../constants'
import { useKeyboardShortcut } from '../../hooks'
import { useGetLinkedAccounts } from '../../services/api/settings.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { isGoogleCalendarLinked } from '../../utils/utils'
import NoStyleLink from '../atoms/NoStyleLink'
import { Divider } from '../atoms/SectionDivider'
import GTButton from '../atoms/buttons/GTButton'
import GTIconButton from '../atoms/buttons/GTIconButton'
import ConnectIntegration from '../molecules/ConnectIntegration'
import { useCalendarContext } from './CalendarContext'

const RelativeDiv = styled.div`
    position: relative;
`
const ConnectContainer = styled.div`
    position: absolute;
    width: 100%;
    z-index: 100;
`
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
    gap: ${Spacing._8};
`
const HeaderIconsContainer = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing._8};
`
const CalendarDateText = styled.div`
    ${Typography.subtitle};
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

    const { data: linkedAccounts } = useGetLinkedAccounts()
    const showOauthPrompt = linkedAccounts !== undefined && !isGoogleCalendarLinked(linkedAccounts)

    if (!showMainHeader && !showDateHeader) return null
    return (
        <RelativeDiv>
            {showMainHeader && (
                <>
                    <PaddedContainer>
                        <HeaderBodyContainer>
                            {date.startOf('day').equals(DateTime.now().startOf('day')) ? (
                                <NoStyleLink to={`/${FOCUS_MODE_ROUTE}`}>
                                    <GTButton
                                        icon={icons.headphones}
                                        iconColor="black"
                                        value="Enter Focus Mode"
                                        size="small"
                                        styleType="secondary"
                                    />
                                </NoStyleLink>
                            ) : (
                                <GTButton value="Today" onClick={selectToday} size="small" styleType="secondary" />
                            )}
                            <HeaderIconsContainer>
                                <GTIconButton
                                    onClick={toggleCalendar}
                                    icon={calendarType === 'week' ? icons.arrows_in : icons.arrows_out}
                                />
                                <GTIconButton onClick={() => setIsCollapsed(true)} icon={icons.sidebar} />
                            </HeaderIconsContainer>
                        </HeaderBodyContainer>
                    </PaddedContainer>
                    <Divider color={Colors.border.light} />
                </>
            )}
            {showDateHeader && (
                <PaddedContainer>
                    <HeaderBodyContainer>
                        <CalendarDateText>{`${date.toFormat('ccc, LLL d')}`}</CalendarDateText>
                        <ButtonContainer>
                            <GTIconButton onClick={selectPrevious} icon={icons.caret_left} />
                            <GTIconButton onClick={selectNext} icon={icons.caret_right} />
                        </ButtonContainer>
                    </HeaderBodyContainer>
                </PaddedContainer>
            )}
            {showOauthPrompt && (
                <ConnectContainer>
                    <ConnectIntegration type="google_calendar" />
                </ConnectContainer>
            )}
        </RelativeDiv>
    )
}
