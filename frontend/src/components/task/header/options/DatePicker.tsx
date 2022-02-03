import { DateTime, Info } from 'luxon'
import React, { Dispatch, useCallback, useState } from 'react'
import { Action } from 'redux'
import { TASKS_MODIFY_URL } from '../../../../constants'
import { makeAuthorizedRequest } from '../../../../helpers/utils'
import { useAppDispatch } from '../../../../redux/hooks'
import { hideDatePicker } from '../../../../redux/tasksPageSlice'
import { useFetchTasks } from '../../TasksPage'

import { BottomBar, PickerContainer, TopNav, MonthContainer, Icon, MonthYearHeader, HoverButton, DayLabel, WeekDayTable, WeekDay, BottomDateView, CurrentDateText, DayTable } from './DatePicker-style'

interface DatePickerProps {
    task_id: string
    due_date: string
}
export default function DatePicker({ task_id, due_date }: DatePickerProps): JSX.Element {
    const dispatch = useAppDispatch()
    const fetchTasks = useFetchTasks()
    const [date, setDate] = useState<DateTime>(DateTime.local().startOf('month'))
    const currentDueDate = DateTime.fromISO(due_date)
    const monthyear = date.toLocaleString({ month: 'long', year: 'numeric' }).toUpperCase()

    const nextMonth = useCallback(() => setDate(date => {
        return date.plus({ months: 1 })
    }), [date, setDate])
    const prevMonth = useCallback(() => setDate(date => {
        return date.minus({ months: 1 })
    }), [date, setDate])

    const getWeek = (weekNumber: number, weekYear: number): JSX.Element[] => {
        const weekDays: JSX.Element[] = []
        const startDate = DateTime.fromObject({ weekNumber: weekNumber, weekYear: weekYear })
        for (let curDay = 0; curDay < 7; curDay++) {
            const day = startDate.plus({ days: curDay })
            const hoverButtonClick = (event: React.MouseEvent) => {
                event.stopPropagation()
                setDate(day)
                editDueDate(task_id, day.toISO(), dispatch, fetchTasks)
            }
            const isToday = day.hasSame(DateTime.local(), 'day')
            const isThisMonth = day.hasSame(date, 'month')
            const isSelected = day.hasSame(currentDueDate, 'day')
            weekDays.push(
                <td key={curDay}>
                    <HoverButton isToday={isToday} isSelected={isSelected} onClick={hoverButtonClick}>
                        <DayLabel grayed={!isThisMonth} isSelected={isSelected} >{day.day}</DayLabel>
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
        for (let curWeek = 0; startDayOfMonth.plus({ weeks: curWeek }).startOf('week') <= endDayOfMonth.startOf('week'); curWeek++) {
            const week = startDayOfMonth.plus({ weeks: curWeek })
            weeks.push(
                <tr key={week.weekNumber}>
                    {getWeek(week.weekNumber, week.weekYear)}
                </tr>
            )
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
                            {days.map((day, index) => <WeekDay key={index}>{day}</WeekDay>)}
                        </tr>
                    </thead>
                </WeekDayTable>
                <DayTable>
                    <tbody>
                        {getFullMonth()}
                    </tbody>
                </DayTable>
            </MonthContainer>
        )
    }

    return (
        <PickerContainer onClick={(e) => { e.stopPropagation() }}>
            <TopNav>
                <HoverButton isToday={false} isSelected={false} onClick={(e) => {
                    e.stopPropagation()
                    prevMonth()
                }}>
                    <Icon src={`${process.env.PUBLIC_URL}/images/CaretLeft.svg`} alt="Previous Month" />
                </HoverButton>
                <MonthYearHeader>{monthyear}</MonthYearHeader>
                <HoverButton isToday={false} isSelected={false} onClick={(e) => {
                    e.stopPropagation()
                    nextMonth()
                }}>
                    <Icon src={`${process.env.PUBLIC_URL}/images/CaretRight.svg`} alt="Next Month" />
                </HoverButton>
            </TopNav>
            {monthTable()}
            <BottomBar>
                <BottomDateView>
                    <Icon src={`${process.env.PUBLIC_URL}/images/CalendarBlank.svg`} />
                    <CurrentDateText>
                        {currentDueDate.isValid ? currentDueDate.toLocaleString() : 'MM/DD/YYYY'}
                    </CurrentDateText>
                    <HoverButton isToday={false} isSelected={false} onClick={(e) => {
                        e.stopPropagation()
                        setDate(DateTime.fromMillis(1))
                        editDueDate(task_id, DateTime.fromMillis(1).toISO(), dispatch, fetchTasks)
                    }}>
                        <Icon src={`${process.env.PUBLIC_URL}/images/close.svg`} />
                    </HoverButton>
                </BottomDateView>
            </BottomBar>
        </PickerContainer>
    )
}

const editDueDate = async (task_id: string, due_date: string, dispatch: Dispatch<Action<string>>, fetchTasks: () => void) => {
    try {
        dispatch(hideDatePicker())
        const response = await makeAuthorizedRequest({
            url: TASKS_MODIFY_URL + task_id + '/',
            method: 'PATCH',
            body: JSON.stringify({ 'due_date': due_date })
        })

        if (!response.ok) {
            throw new Error('PATCH /tasks/modify Edit Due Date failed: ' + response.text())
        }
        fetchTasks()
    } catch (e) {
        console.log({ e })
    }
}
