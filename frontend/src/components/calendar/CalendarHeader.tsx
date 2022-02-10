import React, { useCallback } from 'react'
import { flex } from '../../helpers/styles'
import { useAppDispatch } from '../../redux/hooks'
import { setShowCalendarSidebar, setShowFullCalendar } from '../../redux/tasksPageSlice'
import ExpandCollapse from '../common/ExpandCollapse'
import Tooltip from '../common/Tooltip'
import { CalendarHeaderContainer, HoverButton, Icon, DateDisplay } from './CalendarHeader-styles'

interface CalendarHeaderProps {
    date: Date
    setDate: React.Dispatch<React.SetStateAction<Date>>
}
export default function CalendarHeader({ date, setDate }: CalendarHeaderProps): JSX.Element {
    const dispatch = useAppDispatch()

    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' })
    const dayNum = date.getDate()
    const month = date.toLocaleString('default', { month: 'short' })

    const selectNextDay = useCallback(
        () =>
            setDate((date) => {
                const newDate = new Date(date)
                newDate.setDate(date.getDate() + 1)
                return newDate
            }),
        [date, setDate]
    )
    const selectPreviousDay = useCallback(
        () =>
            setDate((date) => {
                const newDate = new Date(date)
                newDate.setDate(date.getDate() - 1)
                return newDate
            }),
        [date, setDate]
    )

    return (
        <CalendarHeaderContainer>
            <flex.flex>
                <ExpandCollapse direction="right" onClick={() => dispatch(setShowCalendarSidebar(false))} />
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
                    <HoverButton main onClick={() => setDate(new Date())}>
                        Today
                    </HoverButton>
                </Tooltip>
                <Tooltip text="Expand/Collapse" placement='below' >
                    <HoverButton onClick={() => dispatch(setShowFullCalendar(true))}>
                        <Icon src={`${process.env.PUBLIC_URL}/images/ArrowsOutSimple.svg`} alt="Expand/Collapse" />
                    </HoverButton>
                </Tooltip>
            </flex.flex>
        </CalendarHeaderContainer>
    )
}
