import React, { Dispatch } from 'react'
import { Action } from 'redux'
import { TASKS_MODIFY_URL } from '../../../constants'
import { makeAuthorizedRequest } from '../../../helpers/utils'
import { useAppDispatch } from '../../../redux/hooks'
import { hideTimeEstimate } from '../../../redux/tasksPageSlice'
import { useFetchTasks } from '../TasksPage'
import { TopNav } from './DatePicker-style'
import { TimeEstimateContainer, Header, TimeButton } from './TimeEstimate-style'


interface TimeEstimateProps {
    task_id: string
}
export default function TimeEstimate({ task_id }: TimeEstimateProps): JSX.Element {
    const dispatch = useAppDispatch()
    const fetchTasks = useFetchTasks()

    const timeValues = [5, 10, 15, 30, 45, 60]

    return (
        <TimeEstimateContainer onClick={(e) => {
            e.stopPropagation()
        }}>
            <TopNav>
                <Header>Set Duration</Header>
            </TopNav>
            {
                timeValues.map((val, i) => {
                    return (
                        <TimeButton key={i} onClick={
                            (e) => {
                                e.stopPropagation()
                                editTimeEstimate(task_id, val * 60, dispatch, fetchTasks)
                            }
                        }>
                            {val} min
                        </TimeButton>
                    )
                })
            }
        </TimeEstimateContainer>
    )
}

const editTimeEstimate = async (task_id: string, time_estimate: number, dispatch: Dispatch<Action<string>>, fetchTasks: () => void) => {
    try {
        dispatch(hideTimeEstimate())
        const response = await makeAuthorizedRequest({
            url: TASKS_MODIFY_URL + task_id + '/',
            method: 'PATCH',
            body: JSON.stringify({ 'time_duration': time_estimate })
        })

        if (!response.ok) {
            throw new Error('PATCH /tasks/modify Edit Time Estimate failed: ' + response.text())
        }
        fetchTasks()
    } catch (e) {
        console.log({ e })
    }
}
