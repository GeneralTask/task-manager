import React, { Dispatch } from 'react'
import { Action } from 'redux'
import { CLOSE_ICON, TASKS_MODIFY_URL } from '../../constants'
import { makeAuthorizedRequest } from '../../helpers/utils'
import { useAppDispatch } from '../../redux/hooks'
import { hideTimeEstimate } from '../../redux/tasksPageSlice'
import { useFetchTasks } from '../task/TasksPage'
import { Header, TimeEstimateContainer, TopNav, CloseButton, TimeInput, TimeButton } from './TimeEstimate-style'

interface TimeEstimateProps {
    task_id: string
}
export default function TimeEstimate({task_id}: TimeEstimateProps): JSX.Element {
    const dispatch = useAppDispatch()
    const fetchTasks = useFetchTasks()

    return (
        <TimeEstimateContainer>
            <TopNav>
                <Header>Set Duration</Header>
                <CloseButton src={CLOSE_ICON} alt="close" onClick={
                    (e) => {
                        e.stopPropagation()
                        dispatch(hideTimeEstimate())
                    }
                } />
            </TopNav>
            {/* <TimeInput type="number" placeholder="1:00" /> */}
            {
                [5, 10, 15, 30, 45, 60].map((val, i) => {
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
        await fetchTasks()
    } catch (e) {
        console.log({ e })
    }
  }