import { DateTime, Info } from 'luxon'
import React, { Dispatch, useCallback, useState } from 'react'
import { Action } from 'redux'
import { TASKS_MODIFY_URL } from '../../../constants'
import { makeAuthorizedRequest } from '../../../helpers/utils'
import { useAppDispatch } from '../../../redux/hooks'
import { hideDatePicker } from '../../../redux/tasksPageSlice'
import { useFetchTasks } from '../TasksPage'

import { BottomBar, PickerContainer, TopNav, MonthContainer, Icon, MonthYearHeader, HoverButton } from './DatePicker-style'

interface DatePickerProps {
    task_id: string
}
export default function DatePicker({ task_id }: DatePickerProps): JSX.Element {
    const dispatch = useAppDispatch()
    const fetchTasks = useFetchTasks()
    const [date, setDate] = useState<DateTime>(DateTime.local().startOf('month'))
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
            weekDays.push(
                <td key={curDay}>
                    <HoverButton onClick={hoverButtonClick}>
                        {day.day}
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
            <table>
                <thead>
                    <tr key={'header'}>
                        {days.map((day, index) => <th key={index}>{day}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {getFullMonth()}
                </tbody>
            </table>
        )
    }

    return (
        <PickerContainer onClick={(e) => { e.stopPropagation() }}>
            <TopNav>
                <HoverButton onClick={(e) => {
                    e.stopPropagation()
                    prevMonth()
                }}>
                    <Icon src={`${process.env.PUBLIC_URL}/images/CaretLeft.svg`} alt="Previous Month" />
                </HoverButton>
                <MonthYearHeader>{monthyear}</MonthYearHeader>
                <HoverButton onClick={(e) => {
                    e.stopPropagation()
                    nextMonth()
                }}>
                    <Icon src={`${process.env.PUBLIC_URL}/images/CaretRight.svg`} alt="Next Month" />
                </HoverButton>
            </TopNav>
            <MonthContainer>{monthTable()}</MonthContainer>
            <BottomBar />
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
