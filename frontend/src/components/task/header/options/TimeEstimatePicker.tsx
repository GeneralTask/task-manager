import React, { Dispatch } from 'react'
import { Action } from 'redux'
import { TASKS_MODIFY_URL } from '../../../../constants'
import { makeAuthorizedRequest } from '../../../../helpers/utils'
import { useAppDispatch } from '../../../../redux/hooks'
import { hideTimeEstimate } from '../../../../redux/tasksPageSlice'
import { useFetchTasks } from '../../TasksPage'
import { TopNav } from './DatePicker-style'
import { TimeEstimateContainer, Header, TimeButton } from './TimeEstimate-style'
import Select from 'react-select'

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
            <Select
                options={options}
                onChange={(e) => {
                    const duration = e?.value
                    console.log(duration)
                }}
                onKeyDown={(e) => e.stopPropagation()}
            />
            {/* {timeValues.map((val, i) => {
                return (
                    <TimeButton
                        key={i}
                        onClick={(e) => {
                            e.stopPropagation()
                            editTimeEstimate(task_id, val * 60, dispatch, fetchTasks)
                        }}
                    >
                        {val} min
                    </TimeButton>
                )
            })} */}
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
