import {
    BottomBar,
    BottomDateView,
    CurrentDateText,
    DayLabel,
    DayTable,
    HoverButton,
    IconContainer,
    MonthContainer,
    MonthYearHeader,
    PickerContainer,
    TopNav,
    WeekDay,
    WeekDayTable,
} from './DatePicker-style'
import { DateTime, Info } from 'luxon'
import React, { useCallback, useState } from 'react'

import { Icon } from '../atoms/Icon'
import { icons } from '../../styles/images'
import { useModifyTask } from '../../services/api/tasks.hooks'

interface DatePickerProps {
    task_id: string
    due_date: string
    closeDatePicker: () => void
}
function DatePicker({ task_id, due_date, closeDatePicker }: DatePickerProps): JSX.Element {
    const { mutate: modifyTask } = useModifyTask()
    const [date, setDate] = useState<DateTime>(DateTime.local().startOf('month'))
    const currentDueDate = DateTime.fromISO(due_date)
    const monthyear = date.toLocaleString({ month: 'long', year: 'numeric' }).toUpperCase()

    const nextMonth = useCallback(
        () =>
            setDate((date) => {
                return date.plus({ months: 1 })
            }),
        [date, setDate]
    )
    const prevMonth = useCallback(
        () =>
            setDate((date) => {
                return date.minus({ months: 1 })
            }),
        [date, setDate]
    )

    const getWeek = (weekNumber: number, weekYear: number): JSX.Element[] => {
        const weekDays: JSX.Element[] = []
        const startDate = DateTime.fromObject({ weekNumber: weekNumber, weekYear: weekYear })
        for (let curDay = 0; curDay < 7; curDay++) {
            const day = startDate.plus({ days: curDay })
            const hoverButtonClick = (event: React.MouseEvent) => {
                event.stopPropagation()
                setDate(day)
                modifyTask({ id: task_id, dueDate: day.toISO() })
                closeDatePicker()
            }
            const isToday = day.hasSame(DateTime.local(), 'day')
            const isThisMonth = day.hasSame(date, 'month')
            const isSelected = day.hasSame(currentDueDate, 'day')
            weekDays.push(
                <td key={curDay}>
                    <HoverButton isToday={isToday} isSelected={isSelected} onClick={hoverButtonClick}>
                        <DayLabel grayed={!isThisMonth} isSelected={isSelected}>
                            {day.day}
                        </DayLabel>
                    </HoverButton>
                </td>
            )
        }
        return weekDays
    }

    const getFullMonth = (): JSX.Element => {
        const weeks: JSX.Element[] = []
        const startDayOfMonth = date.startOf('month')
        const endDayOfMonth = date.endOf('month')
        for (
            let curWeek = 0;
            startDayOfMonth.plus({ weeks: curWeek }).startOf('week') <= endDayOfMonth.startOf('week');
            curWeek++
        ) {
            const week = startDayOfMonth.plus({ weeks: curWeek })
            weeks.push(<tr key={week.weekNumber}>{getWeek(week.weekNumber, week.weekYear)}</tr>)
        }
        return <>{weeks}</>
    }

    const monthTable = (): JSX.Element => {
        const days = Info.weekdays('narrow') // ['M', 'T', 'W', 'T', 'F', 'S', 'S']
        return (
            <MonthContainer>
                <WeekDayTable>
                    <thead>
                        <tr key={'header'}>
                            {days.map((day, index) => (
                                <WeekDay key={index}>{day}</WeekDay>
                            ))}
                        </tr>
                    </thead>
                </WeekDayTable>
                <DayTable>
                    <tbody>{getFullMonth()}</tbody>
                </DayTable>
            </MonthContainer>
        )
    }

    return (
        <PickerContainer
            onClick={(e) => {
                e.stopPropagation()
            }}
        >
            <TopNav>
                <HoverButton
                    isToday={false}
                    isSelected={false}
                    onClick={(e) => {
                        e.stopPropagation()
                        prevMonth()
                    }}
                >
                    <Icon source={icons['caret_left']} size="xSmall" />
                </HoverButton>
                <MonthYearHeader>{monthyear}</MonthYearHeader>
                <HoverButton
                    isToday={false}
                    isSelected={false}
                    onClick={(e) => {
                        e.stopPropagation()
                        nextMonth()
                    }}
                >
                    <Icon source={icons['caret_right']} size="xSmall" />
                </HoverButton>
            </TopNav>
            {monthTable()}
            <BottomBar>
                <BottomDateView>
                    <IconContainer>
                        <Icon source={icons['calendar_blank']} size="xSmall" />
                    </IconContainer>
                    <CurrentDateText>
                        {currentDueDate.isValid ? currentDueDate.toLocaleString() : 'MM/DD/YYYY'}
                    </CurrentDateText>
                    <HoverButton
                        isToday={false}
                        isSelected={false}
                        onClick={(e) => {
                            e.stopPropagation()
                            setDate(DateTime.fromMillis(1))
                            modifyTask({ id: task_id, dueDate: DateTime.fromMillis(1).toISO() })
                            closeDatePicker()
                        }}
                    >
                        <IconContainer>
                            <Icon source={icons['trash']} size="xSmall" />
                        </IconContainer>
                    </HoverButton>
                </BottomDateView>
            </BottomBar>
        </PickerContainer>
    )
}

export default DatePicker
