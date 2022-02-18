import React, { Dispatch } from 'react'
import { Action } from 'redux'
import { TASKS_MODIFY_URL, TIME_ICON } from '../../../../constants'
import { makeAuthorizedRequest } from '../../../../helpers/utils'
import { useAppDispatch } from '../../../../redux/hooks'
import { hideTimeEstimate } from '../../../../redux/tasksPageSlice'
import { useFetchTasks } from '../../TasksPage'
import { TopNav } from './DatePicker-style'
import { TimeEstimateContainer, Header, dropdownStyles } from './TimeEstimate-style'
import Select from 'react-select'
import GTSelect from '../../../common/GTSelect'

interface TimeEstimateProps {
    task_id: string
}
export default function TimeEstimate({ task_id }: TimeEstimateProps): JSX.Element {
    const dispatch = useAppDispatch()
    const fetchTasks = useFetchTasks()

    const options = [
        { value: 5, label: '5 mins' },
        { value: 10, label: '10 mins' },
        { value: 15, label: '15 mins' },
        { value: 20, label: '20 mins' },
        { value: 30, label: '30 mins' },
        { value: 45, label: '45 mins' },
        { value: 60, label: '1 hour' },
        { value: 90, label: '1.5 hours' },
        { value: 120, label: '2 hours' },
        { value: 180, label: '3 hours' },
        { value: 240, label: '4 hours' },
        { value: 300, label: '5 hours' },
        { value: 360, label: '6 hours' },
    ]

    return (
        <TimeEstimateContainer
            onClick={(e) => {
                e.stopPropagation()
            }}
        >
            <TopNav>
                <Header>Set Duration</Header>
            </TopNav>
            <GTSelect
                onChange={(e) => {
                    e.stopPropagation()
                }}
                placeholder={'HH:MM'}
                options={options}
                pattern={'^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$'}
                inputIcon={TIME_ICON}
            />
            {/* <Select
                options={options}
                styles={dropdownStyles}
                onChange={(e) => {
                    const duration = e?.value as number
                    editTimeEstimate(task_id, duration * 60, dispatch, fetchTasks)
                }}
                onKeyDown={(e) => e.stopPropagation()}
            /> */}
        </TimeEstimateContainer>
    )
}

const editTimeEstimate = async (
    task_id: string,
    time_estimate: number,
    dispatch: Dispatch<Action<string>>,
    fetchTasks: () => void
) => {
    try {
        dispatch(hideTimeEstimate())
        const response = await makeAuthorizedRequest({
            url: TASKS_MODIFY_URL + task_id + '/',
            method: 'PATCH',
            body: JSON.stringify({ time_duration: time_estimate }),
        })

        if (!response.ok) {
            throw new Error('PATCH /tasks/modify Edit Time Estimate failed: ' + response.text())
        }
        fetchTasks()
    } catch (e) {
        console.log({ e })
    }
}
