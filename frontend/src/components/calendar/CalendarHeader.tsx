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

    const selectNext = useCallback(
        () =>
            setDate((date) => {
                const amt = selectValue.label === 'Day' ? 1 : 7
                return date.plus({ days: amt })
            }),
        [date, setDate]
    )
    const selectPrevious = useCallback(
        () =>
            setDate((date) => {
                const amt = selectValue.label === 'Day' ? 1 : 7
                return date.minus({ days: amt })
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
                    {selectValue.label === 'Day' ? (
                        <DateDisplay>{`${date.toFormat('ccc, LLL d')}`}</DateDisplay>
                    ) : (
                        <DateDisplay>
                            {`${date.toFormat('LLL d')} - ${date.plus({ days: 6 }).toFormat('LLL d')}`}
                        </DateDisplay>
                    )}
                    {/* <DateDisplay>{`${dayOfWeek}, ${month} ${dayNum}`}</DateDisplay> */}
                </flex.alignItemsCenter>
                <flex.alignItemsCenter>
                    <HoverButton main onClick={() => setDate(DateTime.now())}>
                        Today
                    </HoverButton>
                    <HoverButton onClick={selectPrevious}>
                        <Icon src={`${process.env.PUBLIC_URL}/images/CaretLeft.svg`} alt="Show previous" />
                    </HoverButton>
                    <HoverButton onClick={selectNext}>
                        <Icon src={`${process.env.PUBLIC_URL}/images/CaretRight.svg`} alt="Show next" />
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
