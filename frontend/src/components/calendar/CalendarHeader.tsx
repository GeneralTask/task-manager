import { DateTime } from 'luxon'
import React, { useCallback } from 'react'
import { flex } from '../../helpers/styles'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { setShowCalendarSidebar, setShowFullCalendar } from '../../redux/tasksPageSlice'
import ExpandCollapse from '../common/ExpandCollapse'
import Tooltip from '../common/Tooltip'
import { CalendarHeaderContainer, HoverButton, Icon, DateDisplay } from './CalendarHeader-styles'

interface CalendarHeaderProps {
    date: DateTime
    setDate: React.Dispatch<React.SetStateAction<DateTime>>
}
export default function CalendarHeader({ date, setDate }: CalendarHeaderProps): JSX.Element {
    const dispatch = useAppDispatch()
    const isFullCalendarShown = useAppSelector(state => state.tasks_page.events.show_full_calendar)

    const dayOfWeek = date.toLocaleString({ weekday: 'short' })
    const dayNum = date.day
    const month = date.toLocaleString({ month: 'short' })

    const selectNextDay = useCallback(
        () =>
            setDate((date) => {
                return date.plus({ days: 1 })
            }),
        [date, setDate]
    )
    const selectPreviousDay = useCallback(
        () =>
            setDate((date) => {
                return date.minus({ days: 1 })
            }),
        [date, setDate]
    )
    function collapse(): void {
        if (isFullCalendarShown) {
            dispatch(setShowFullCalendar(false))
        } else {
            dispatch(setShowCalendarSidebar(false))
        }
    }

    return (
        <CalendarHeaderContainer>
            <flex.flex>
                <ExpandCollapse direction="right" onClick={collapse} />
                <DateDisplay>{`${dayOfWeek}, ${month} ${dayNum}`}</DateDisplay>
                <HoverButton onClick={selectPreviousDay}>
                    <Icon src={`${process.env.PUBLIC_URL}/images/CaretLeft.svg`} alt="Show previous day" />
                </HoverButton>
                <HoverButton onClick={selectNextDay}>
                    <Icon src={`${process.env.PUBLIC_URL}/images/CaretRight.svg`} alt="Show next day" />
                </HoverButton>
            </flex.flex>
            <flex.flex>
                <Tooltip text="Today" placement='below' >
                    <HoverButton main onClick={() => setDate(new DateTime())}>
                        Today
                    </HoverButton>
                </Tooltip>
                <HoverButton onClick={() => dispatch(setShowFullCalendar(true))}>
                    <Icon src={`${process.env.PUBLIC_URL}/images/ArrowsOutSimple.svg`} alt="Expand/Collapse" />
                </HoverButton>
            </flex.flex>
        </CalendarHeaderContainer>
    )
}
