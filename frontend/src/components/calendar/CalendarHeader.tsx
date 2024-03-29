import { useCallback, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { useKeyboardShortcut } from '../../hooks'
import { Colors, Spacing } from '../../styles'
import { icons } from '../../styles/images'
import Flex from '../atoms/Flex'
import { Divider } from '../atoms/SectionDivider'
import GTButton from '../atoms/buttons/GTButton'
import { TitleMedium } from '../atoms/typography/Typography'
import { useCalendarContext } from './CalendarContext'

const RelativeDiv = styled.div`
    position: relative;
`

const PaddedContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${Spacing._8} ${Spacing._12};
`

interface CalendarHeaderProps {
    showHeader?: boolean
    additionalHeaderContent?: React.ReactNode
}
export default function CalendarHeader({ showHeader = true, additionalHeaderContent }: CalendarHeaderProps) {
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
    const isSuperDashboardPage = pathname.startsWith('/super-dashboard')

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
    const isCalendarShowingToday = useMemo(() => {
        const startOfToday = DateTime.now().startOf('day')
        const isToday = date.startOf('day').equals(startOfToday)
        const isThisWeek = date.startOf('day').equals(startOfToday.minus({ days: startOfToday.weekday % 7 }))
        return isToday || (calendarType === 'week' && isThisWeek)
    }, [date, calendarType])
    useKeyboardShortcut('jumpToToday', selectToday, isFocusMode)
    useKeyboardShortcut(isCalendarExpanded ? 'nextWeek' : 'nextDay', selectNext, isFocusMode)
    useKeyboardShortcut(isCalendarExpanded ? 'previousWeek' : 'previousDay', selectPrevious, isFocusMode)

    const goToTodayButton = (
        <GTButton value="Today" onClick={selectToday} styleType="control" disabled={isCalendarShowingToday} />
    )
    const nextPreviousButtons = (
        <Flex gap={Spacing._8} alignItems="center">
            <GTButton
                styleType="icon"
                shortcutName={isCalendarExpanded ? 'previousWeek' : 'previousDay'}
                onClick={selectPrevious}
                icon={icons.caret_left}
            />
            {goToTodayButton}
            <GTButton
                styleType="icon"
                shortcutName={isCalendarExpanded ? 'nextWeek' : 'nextDay'}
                onClick={selectNext}
                icon={icons.caret_right}
            />
            {additionalHeaderContent}
        </Flex>
    )

    if (!showHeader) return null
    return (
        <RelativeDiv>
            {showHeader && (
                <>
                    <PaddedContainer>
                        <Flex gap={Spacing._16} alignItems="center">
                            {isCalendarExpanded && !showTaskToCalSidebar && !isSuperDashboardPage && (
                                <GTButton
                                    icon={icons.hamburger}
                                    value="Open task list"
                                    styleType="secondary"
                                    onClick={() => {
                                        setShowTaskToCalSidebar(true)
                                    }}
                                />
                            )}
                            {isCalendarExpanded && (
                                <>
                                    {nextPreviousButtons}
                                    <TitleMedium>{date.toFormat('LLLL yyyy')}</TitleMedium>
                                </>
                            )}
                        </Flex>
                        <Flex gap={Spacing._8} alignItems="center">
                            <GTButton
                                styleType="icon"
                                shortcutName={calendarType === 'week' ? 'toggleDailyCalendar' : 'toggleWeeklyCalendar'}
                                onClick={toggleCalendar}
                                icon={calendarType === 'week' ? icons.arrows_in : icons.arrows_out}
                            />
                            <GTButton
                                styleType="icon"
                                shortcutName="calendar"
                                onClick={() => setIsCollapsed(true)}
                                icon={icons.sidebarFlipped}
                            />
                        </Flex>
                    </PaddedContainer>
                    <Divider color={Colors.background.border} />
                    {!isCalendarExpanded && (
                        <PaddedContainer>
                            <TitleMedium>{date.toFormat('ccc, LLLL d')}</TitleMedium>
                            {nextPreviousButtons}
                        </PaddedContainer>
                    )}
                </>
            )}
        </RelativeDiv>
    )
}
