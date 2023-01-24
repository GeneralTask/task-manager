import { useCallback, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { useKeyboardShortcut } from '../../hooks'
import { useGetLinkedAccounts } from '../../services/api/settings.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { isGoogleCalendarLinked } from '../../utils/utils'
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
const HeaderActionsContainer = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing._8};
`
const CalendarDateText = styled.div`
    ${Typography.subtitle};
`

interface CalendarHeaderProps {
    showMainHeader?: boolean
    showDateHeader?: boolean
    additionalHeaderContent?: React.ReactNode
}
export default function CalendarHeader({
    showMainHeader = true,
    showDateHeader = true,
    additionalHeaderContent,
}: CalendarHeaderProps) {
    const {
        calendarType,
        setCalendarType,
        setIsCollapsed,
        isCollapsed,
        showTaskToCalSidebar,
        setShowTaskToCalSidebar,
        date,
        setDate,
        dayViewDate,
        setDayViewDate,
    } = useCalendarContext()
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
    useEffect(() => {
        if (calendarType === 'week' && date.weekday !== 7) {
            setDate(date.minus({ days: date.weekday % 7 }))
        }
    }, [calendarType, setCalendarType, setDate, date])

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
        setDate(date.plus({ days: isCalendarExpanded ? 7 : 1 }))
    }, [date, setDate, setDayViewDate, dayViewDate, isCalendarExpanded])
    const selectPrevious = useCallback(() => {
        if (calendarType === 'day') {
            setDayViewDate(dayViewDate.minus({ days: 1 }))
        }
        setDate(date.minus({ days: isCalendarExpanded ? 7 : 1 }))
    }, [date, setDate, setDayViewDate, dayViewDate, isCalendarExpanded])
    useKeyboardShortcut('jumpToToday', selectToday, isFocusMode)
    useKeyboardShortcut('nextDate', selectNext, isFocusMode)
    useKeyboardShortcut('previousDate', selectPrevious, isFocusMode)

    const { data: linkedAccounts } = useGetLinkedAccounts()
    const showOauthPrompt = linkedAccounts !== undefined && !isGoogleCalendarLinked(linkedAccounts)

    if (!showMainHeader && !showDateHeader) return null

    const isCalendarShowingToday = useMemo(() => {
        const startOfToday = DateTime.now().startOf('day')
        const isToday = date.startOf('day').equals(startOfToday)
        const isThisWeek = date.startOf('day').equals(startOfToday.minus({ days: startOfToday.weekday % 7 }))
        return isToday || (calendarType === 'week' && isThisWeek)
    }, [date, calendarType])

    const topLeftButtons = useMemo(() => {
        return (
            <>
                {(isCalendarShowingToday || calendarType === 'week') &&
                    (!showTaskToCalSidebar || calendarType === 'day') && (
                        <GTButton
                            icon={icons.calendar_pen}
                            iconColor="black"
                            value="Schedule Tasks"
                            size="small"
                            styleType="secondary"
                            onClick={() => {
                                setCalendarType('week')
                                setDate(date.minus({ days: date.weekday % 7 }))
                                setShowTaskToCalSidebar(true)
                            }}
                        />
                    )}
                {!isCalendarShowingToday && (
                    <GTButton
                        value="Jump to Today"
                        icon={icons.calendar_star}
                        onClick={selectToday}
                        size="small"
                        styleType="secondary"
                    />
                )}
            </>
        )
    }, [isCalendarShowingToday, calendarType, date, showTaskToCalSidebar])

    return (
        <RelativeDiv>
            {showMainHeader && (
                <>
                    <PaddedContainer>
                        <HeaderBodyContainer>
                            <HeaderActionsContainer>{topLeftButtons}</HeaderActionsContainer>
                            <HeaderActionsContainer>
                                <GTIconButton
                                    shortcutName={calendarType === 'week' ? 'showDailyCalendar' : 'showWeeklyCalendar'}
                                    onClick={toggleCalendar}
                                    icon={calendarType === 'week' ? icons.arrows_in : icons.arrows_out}
                                />
                                <GTIconButton
                                    shortcutName="calendar"
                                    onClick={() => setIsCollapsed(true)}
                                    icon={icons.sidebarFlipped}
                                />
                            </HeaderActionsContainer>
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
                            <GTIconButton
                                shortcutName="previousDate"
                                onClick={selectPrevious}
                                icon={icons.caret_left}
                            />
                            <GTIconButton shortcutName="nextDate" onClick={selectNext} icon={icons.caret_right} />
                            {additionalHeaderContent}
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
