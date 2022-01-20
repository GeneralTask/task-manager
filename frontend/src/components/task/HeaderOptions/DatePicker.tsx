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
    const [date, setDate] = useState<Date>(new Date())
    const monthyear = date.toLocaleDateString('default', { month: 'long', year: 'numeric' }).toUpperCase()

    const nextMonth = useCallback(() => setDate(date => {
        const newDate = new Date(date)
        newDate.setMonth(date.getMonth() + 1)
        return newDate
    }), [date, setDate])
    const prevMonth = useCallback(() => setDate(date => {
        const newDate = new Date(date)
        newDate.setMonth(date.getMonth() - 1)
        return newDate
    }), [date, setDate])

    const daysInMonth = (): number => {
        const temp_date = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        return temp_date.getDate()
    }
    const firstDayOfMonth = (): number => {
        const temp_date = new Date(date.getFullYear(), date.getMonth(), 1)
        return temp_date.getDay()
    }
    const lastDayOfMonth = (): number => {
        const temp_date = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        return temp_date.getDay()
    }

    const getDays = (amount: number, startDay: number): JSX.Element => {
        const month = date.getMonth()
        const year = date.getFullYear()

        return (
            <>
                {
                    Array(amount).map((i, index) => {
                        const day = index + startDay
                        const tmpDate = new Date(year, month, day)
                        const hoverButtonClick = (event: React.MouseEvent) => {
                            event.stopPropagation()
                            setDate(tmpDate)
                            // TODO: change date to tmpDate
                            editDueDate(task_id, tmpDate.toISOString(), dispatch, fetchTasks)
                        }
                        return (
                            <>
                                <td key={i}>
                                    <HoverButton onClick={hoverButtonClick}>
                                        {tmpDate.getDate()}
                                    </HoverButton>
                                </td>
                                {tmpDate.getDay() === 6 && <tr key={index}></tr>}
                            </>
                        )
                    })
                }
            </>
        )
    }

    const getAllDays = (): JSX.Element =>
        <>
            {getDays(firstDayOfMonth(), -firstDayOfMonth() + 1)}
            {getDays(daysInMonth(), 1)}
            {getDays(6 - lastDayOfMonth(), daysInMonth() + 1)}
        </>

    const monthTable = (): JSX.Element => {
        const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
        return (
            <table>
                <thead>
                    <tr>
                        {days.map((day) => <th>{day}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {getAllDays()}
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
