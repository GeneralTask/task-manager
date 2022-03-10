import { DateTime, Info } from 'luxon'
import React, { useCallback, useState } from 'react'
import { useModifyTaskMutation } from '../../services/generalTaskApi'
import {
    BottomBar,
    BottomDateView,
    CurrentDateText,
    DayLabel,
    DayTable,
    HoverButton,
    Icon,
    MonthContainer,
    MonthYearHeader,
    PickerContainer,
    TopNav,
    WeekDay,
    WeekDayTable
} from './DatePicker-style'


interface DatePickerProps {
    task_id: string
    due_date: string
}
function DatePicker({ task_id, due_date }: DatePickerProps): JSX.Element {
    const [modifyTask] = useModifyTaskMutation()
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
                modifyTask({ id: task_id, due_date: day.toISO() })
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
                    <Icon src={require('../../assets/caret_left.png')} alt="Previous Month" />
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
                    <Icon src={require('../../assets/caret_right.png')} alt="Next Month" />
                </HoverButton>
            </TopNav>
            {monthTable()}
            <BottomBar>
                <BottomDateView>
                    <Icon src={require('../../assets/gcal_gray.png')} />
                    <CurrentDateText>
                        {currentDueDate.isValid ? currentDueDate.toLocaleString() : 'MM/DD/YYYY'}
                    </CurrentDateText>
                    <HoverButton
                        isToday={false}
                        isSelected={false}
                        onClick={(e) => {
                            e.stopPropagation()
                            setDate(DateTime.fromMillis(1))
                            modifyTask({ id: task_id, due_date: DateTime.fromMillis(1).toISO() })
                        }}
                    >
                        <Icon src={require('../../assets/trash.png')} />
                    </HoverButton>
                </BottomDateView>
            </BottomBar>
        </PickerContainer>
    )
}

export default DatePicker
