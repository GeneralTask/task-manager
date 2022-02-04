import React from 'react'
import styled from 'styled-components'
import { BLANK_CALENDAR_ICON, EXPAND_ICON, TIME_ICON } from '../../../constants'
import { BACKGROUND_HOVER } from '../../../helpers/styles'
import { useAppDispatch, useAppSelector } from '../../../redux/hooks'
import { collapseBody, expandBody, hideDatePicker, hideTimeEstimate, showDatePicker, showTimeEstimate } from '../../../redux/tasksPageSlice'
import Tooltip from '../../common/Tooltip'
import { ButtonIcon, DueDateButtonText, TimeEstimateButtonText } from './Header-style'
import { Duration } from 'luxon'
import TimeEstimate from './options/TimeEstimatePicker'
import DatePicker from './options/DatePicker'

const ActionContainer = styled.div`
    display: flex;
    gap: 9px;
    margin-right: 9px;
`
const Action = styled.div`
    min-width: 20px;
    height: 20px;
    flex: none;
    order: 0;
    flex-grow: 0;
    cursor: pointer;
    &:hover {
        background-color: ${BACKGROUND_HOVER};
    }
    border-radius: 7px;
    width: max-content;
`
const expandAction = (isExpanded: boolean, taskId: string) => {
    const dispatch = useAppDispatch()
    const onClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        dispatch(isExpanded ? collapseBody() : expandBody(taskId))
    }
    return (
        <Tooltip text={'Expand/Collapse'}>
            <Action onClick={onClick}>
                <ButtonIcon src={EXPAND_ICON} alt="expand" />
            </Action>
        </Tooltip>
    )
}

const timeEstimateAction = (sourceName: string, taskId: string, taskAllocated: number) => {
    if (sourceName !== 'General Task') return (null)
    const defaultAllocation = 3600000000000
    const dispatch = useAppDispatch()

    const timeEstimate = useAppSelector((state) => state.tasks_page.tasks.time_estimate)
    const time_allocated_millis = isNaN(taskAllocated) ? 0 : taskAllocated
    const time_allocated = Duration.fromMillis(time_allocated_millis / 1000).shiftTo('hours', 'minutes')

    const onClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        dispatch(timeEstimate === taskId ? hideTimeEstimate() : showTimeEstimate(taskId))
    }
    const timeEstimateView = (taskAllocated >= defaultAllocation) ?
        <ButtonIcon src={TIME_ICON} alt="time estimate" /> :
        <TimeEstimateButtonText>
            {
                time_allocated.hours > 0 ?
                    `${time_allocated.hours}hr${time_allocated.minutes}m` :
                    `${time_allocated.minutes}m`
            }
        </TimeEstimateButtonText>

    return (
        <>
            <Tooltip text={'Time Estimate'}>
                <Action onClick={onClick}>
                    {timeEstimateView}
                </Action>
            </Tooltip>
            {timeEstimate === taskId && <TimeEstimate task_id={taskId} />}
        </>
    )
}

const dueDateAction = (taskId: string, dueDate: string) => {
    const datePicker = useAppSelector((state) => state.tasks_page.tasks.date_picker)
    const simpleDueDate = new Date(new Date(dueDate).valueOf() + 86400000)
        .toLocaleDateString('default', { day: 'numeric', month: 'short' })

    const dispatch = useAppDispatch()

    const onClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        dispatch(datePicker === taskId ? hideDatePicker() : showDatePicker(taskId))
    }
    return (
        <>
            <Tooltip text={'Due Date'}>
                <Action onClick={onClick}>
                    {
                        dueDate === '' ?
                            <ButtonIcon src={BLANK_CALENDAR_ICON} alt='due date' /> :
                            <DueDateButtonText>{simpleDueDate}</DueDateButtonText>
                    }
                </Action>
            </Tooltip>
            {datePicker === taskId && <DatePicker task_id={taskId} due_date={dueDate} />}
        </>
    )
}

interface HeaderActionsProps {
    isExpanded: boolean
    taskId: string
    timeAllocated: number,
    dueDate: string
}
const HeaderActions = (props: HeaderActionsProps) => {
    const actions = [
        expandAction(props.isExpanded, props.taskId),
        timeEstimateAction('General Task', props.taskId, props.timeAllocated),
        dueDateAction(props.taskId, props.dueDate)
    ]
    return (
        <ActionContainer>
            {
                actions.map((action, index) => {
                    return <React.Fragment key={index}>{action}</React.Fragment>
                })
            }
        </ActionContainer >
    )
}

export default HeaderActions
