import { DateTime } from 'luxon'
import React, { useCallback, useState } from 'react'
import { flex } from '../../helpers/styles'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { setShowFullCalendar } from '../../redux/tasksPageSlice'
import {
    CalendarHeaderContainer,
    HoverButton,
    Icon,
    DateDisplay,
    dropdownStyles,
    CalendarHeaderTitle,
    HeaderTopContainer,
    HeaderMiddleContainer,
    HeaderBottomContainer,
} from './CalendarHeader-styles'
import Select from 'react-select'

const view_options = [
    { value: 1, label: 'Day' },
    { value: 2, label: 'Week' },
]
interface CalendarHeaderProps {
    date: DateTime
    setDate: React.Dispatch<React.SetStateAction<DateTime>>
}
export default function CalendarHeader({ date, setDate }: CalendarHeaderProps): JSX.Element {
    const dispatch = useAppDispatch()
    const isFullCalendarShown = useAppSelector((state) => state.tasks_page.events.show_full_calendar)
    const [selectValue, setSelectValue] = useState(isFullCalendarShown ? view_options[1] : view_options[0])

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
    function handleSelectChange(value: number, label: string): void {
        if (value === 1) {
            dispatch(setShowFullCalendar(false))
        } else {
            dispatch(setShowFullCalendar(true))
        }

        setSelectValue({ value: value, label: label })
    }
    function expand(): void {
        if (isFullCalendarShown) {
            dispatch(setShowFullCalendar(false))
        } else {
            dispatch(setShowFullCalendar(true))
        }
    }

    return (
        <CalendarHeaderContainer>
            <HeaderTopContainer>
                <flex.flex>
                    <CalendarHeaderTitle>Calendar</CalendarHeaderTitle>
                </flex.flex>
                <flex.flex>
                    {/* <HoverButton onClick={(e) => e.stopPropagation()}>
                        <Icon src={`${process.env.PUBLIC_URL}/images/Plus.svg`} alt="Add Event" />
                    </HoverButton> TODO: ADD EVENTS HERE WHEN WE HAVE THAT FUNCTIONALITY*/}
                    <HoverButton onClick={expand}>
                        <Icon src={`${process.env.PUBLIC_URL}/images/ArrowsOutSimple.svg`} alt="Expand/Collapse" />
                    </HoverButton>
                </flex.flex>
            </HeaderTopContainer>
            <HeaderMiddleContainer>
                <flex.alignItemsCenter>
                    <DateDisplay>{`${dayOfWeek}, ${month} ${dayNum}`}</DateDisplay>
                </flex.alignItemsCenter>
                <flex.alignItemsCenter>
                    <HoverButton main onClick={() => setDate(new DateTime())}>
                        Today
                    </HoverButton>
                    <HoverButton onClick={selectPreviousDay}>
                        <Icon src={`${process.env.PUBLIC_URL}/images/CaretLeft.svg`} alt="Show previous day" />
                    </HoverButton>
                    <HoverButton onClick={selectNextDay}>
                        <Icon src={`${process.env.PUBLIC_URL}/images/CaretRight.svg`} alt="Show next day" />
                    </HoverButton>
                </flex.alignItemsCenter>
            </HeaderMiddleContainer>
            <HeaderBottomContainer>
                <Select
                    options={view_options}
                    // defaultValue={selectValue}
                    value={selectValue}
                    onChange={(option) => {
                        if (!option) return
                        if (typeof option.value != 'number') return
                        if (typeof option.label != 'string') return
                        handleSelectChange(option.value, option.label)
                    }}
                    isSearchable={false}
                    styles={dropdownStyles}
                />
            </HeaderBottomContainer>
        </CalendarHeaderContainer>
    )
}
