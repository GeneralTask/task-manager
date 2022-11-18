import { useCallback, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
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
    width: 100%;
    z-index: 100;
`
const PaddedContainer = styled.div`
    padding: ${Spacing._8} ${Spacing._12};
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
    dayViewDate: DateTime
    setDayViewDate: React.Dispatch<React.SetStateAction<DateTime>>
    showMainHeader?: boolean
    showDateHeader?: boolean
    ignoreCalendarContext?: boolean
}
export default function CalendarHeader({
    date,
    setDate,
    showMainHeader = true,
    showDateHeader = true,
    dayViewDate,
    setDayViewDate,
    ignoreCalendarContext,
}: CalendarHeaderProps) {
    const { calendarType, setCalendarType, setIsCollapsed, isCollapsed } = useCalendarContext(ignoreCalendarContext)
    const isCalendarExpanded = calendarType === 'week' && !isCollapsed
    const { pathname } = useLocation()
    const isFocusMode = pathname.startsWith('/focus-mode')

    const toggleCalendar = () => {
        if (calendarType === 'week') {
            setCalendarType('day')
            setDate(dayViewDate)
        } else {
            setCalendarType('week')
            setDate(date.minus({ days: date.weekday % 7 }))
        }
    }
    const selectToday = useCallback(() => {
        if (calendarType === 'day') {
            setDayViewDate(DateTime.now())
        }
        setDate(isCalendarExpanded ? DateTime.now().minus({ days: DateTime.now().weekday % 7 }) : DateTime.now())
    }, [setDate, isCalendarExpanded])

    const selectNext = useCallback(() => {
        if (calendarType === 'day') {
            setDayViewDate(dayViewDate.plus({ days: 1 }))
        }
        setDate((date) => {
            return date.plus({ days: isCalendarExpanded ? 7 : 1 })
        })
    }, [date, setDate, setDayViewDate, dayViewDate, isCalendarExpanded])
    const selectPrevious = useCallback(() => {
        if (calendarType === 'day') {
            setDayViewDate(dayViewDate.minus({ days: 1 }))
        }
        setDate((date) => {
            return date.minus({ days: isCalendarExpanded ? 7 : 1 })
        })
    }, [date, setDate, setDayViewDate, dayViewDate, isCalendarExpanded])
    useKeyboardShortcut('today', selectToday, isFocusMode)
    useKeyboardShortcut('nextDate', selectNext, isFocusMode)
    useKeyboardShortcut('previousDate', selectPrevious, isFocusMode)

    const { data: linkedAccounts } = useGetLinkedAccounts()
    const showOauthPrompt = linkedAccounts !== undefined && !isGoogleCalendarLinked(linkedAccounts)

    if (!showMainHeader && !showDateHeader) return null

    const showFocusModeButton = useMemo(() => {
        const startOfToday = DateTime.now().startOf('day')
        const isToday = date.startOf('day').equals(startOfToday)
        const isThisWeek = date.startOf('day').equals(startOfToday.minus({ days: startOfToday.weekday % 7 }))
        return isToday || (calendarType === 'week' && isThisWeek)
    }, [date, calendarType])

    return (
        <RelativeDiv>
            {showMainHeader && (
                <>
                    <PaddedContainer>
                        <HeaderBodyContainer>
                            {showFocusModeButton ? (
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
                                <GTIconButton onClick={() => setIsCollapsed(true)} icon={icons.sidebarFlipped} />
                            </HeaderIconsContainer>
                        </HeaderBodyContainer>
                    </PaddedContainer>
                    <Divider color={Colors.border.light} />
                </>
            )}
            {showDateHeader && (
                <PaddedContainer>
                    <HeaderBodyContainer>
                        <CalendarDateText>
                            {calendarType === 'week' ? date.toFormat('LLLL yyyy') : date.toFormat('ccc, LLL d')}
                        </CalendarDateText>
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
