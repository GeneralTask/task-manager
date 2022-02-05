import { BLANK_CALENDAR_ICON, DEFAULT_ALLOCATION, EXPAND_ICON, LABEL_ICON, TIME_ICON } from '../../../constants'
import { ButtonIcon, DueDateButtonText, TimeEstimateButtonText } from './Header-style'
import { collapseBody, expandBody, hideDatePicker, hideLabelSelector, hideTimeEstimate, showDatePicker, showLabelSelector, showTimeEstimate } from '../../../redux/tasksPageSlice'
import { useAppDispatch, useAppSelector } from '../../../redux/hooks'

import { BACKGROUND_HOVER } from '../../../helpers/styles'
import DatePicker from './options/DatePicker'
import { Duration } from 'luxon'
import Label from './options/Label'
import React from 'react'
import { TTask } from '../../../helpers/types'
import TimeEstimate from './options/TimeEstimatePicker'
import Tooltip from '../../common/Tooltip'
import styled from 'styled-components'

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

interface ExpandActionProps {
    isExpanded: boolean,
    taskId: string,
}
const ExpandAction = ({ isExpanded, taskId }: ExpandActionProps): JSX.Element => {
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

interface TimeEstimateActionProps {
    sourceName: string,
    taskId: string,
    timeAllocated: number,
}
const TimeEstimateAction = ({ sourceName, taskId, timeAllocated }: TimeEstimateActionProps): JSX.Element => {
    if (sourceName !== 'General Task') return <></>
    const dispatch = useAppDispatch()

    const timeEstimate = useAppSelector((state) => state.tasks_page.tasks.time_estimate)
    const time_allocated_millis = isNaN(timeAllocated) ? 0 : timeAllocated
    const time_allocated = Duration.fromMillis(time_allocated_millis / 1000).shiftTo('hours', 'minutes')

    const onClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        dispatch(timeEstimate === taskId ? hideTimeEstimate() : showTimeEstimate(taskId))
    }
    const timeEstimateView = (timeAllocated >= DEFAULT_ALLOCATION || timeAllocated === 0) ?
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

interface DueDateActionProps {
    taskId: string,
    dueDate: string,
}
const DueDateAction = ({ taskId, dueDate }: DueDateActionProps): JSX.Element => {
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

interface LabelActionProps {
    task: TTask,
}
const LabelAction = ({ task }: LabelActionProps): JSX.Element => {
    const labelSelector = useAppSelector((state) => state.tasks_page.tasks.label_selector)
    const dispatch = useAppDispatch()

    const onClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        dispatch(labelSelector === task.id ? hideLabelSelector() : showLabelSelector(task.id))
    }
    return (
        <>
            <Tooltip text={'Label'}>
                <Action onClick={onClick}>
                    <ButtonIcon src={LABEL_ICON} alt='label' />
                </Action>
            </Tooltip>
            {labelSelector === task.id && <Label task={task} />}
        </>
    )
}

interface HeaderActionsProps {
    isHovering: boolean,
    isExpanded: boolean
    taskId: string
    task: TTask
    timeAllocated: number,
    dueDate: string
}
const HeaderActions = (props: HeaderActionsProps) => {
    let actions = [
        { key: 'Enter', component: <ExpandAction isExpanded={props.isExpanded} taskId={props.taskId} /> },
    ]
    if (props.isHovering) {
        actions = [
            { key: 'F', component: <TimeEstimateAction sourceName="General Task" taskId={props.taskId} timeAllocated={props.timeAllocated} /> },
            { key: 'S', component: <DueDateAction taskId={props.taskId} dueDate={props.dueDate} /> },
            { key: 'L', component: <LabelAction task={props.task} /> },
            ...actions]
    }
    else {
        if (props.dueDate !== '') {
            actions = [{ key: 'S', component: <DueDateAction taskId={props.taskId} dueDate={props.dueDate} /> }, ...actions]
        }
        if (props.timeAllocated < DEFAULT_ALLOCATION && props.timeAllocated !== 0) {
            actions = [{ key: 'F', component: <TimeEstimateAction sourceName="General Task" taskId={props.taskId} timeAllocated={props.timeAllocated} /> }, ...actions]
        }
    }

    return (
        <ActionContainer>
            {
                actions.map(({ component }, index) => {
                    return <React.Fragment key={index}>{component}</React.Fragment>
                })
            }
        </ActionContainer >
    )
}

export default HeaderActions
