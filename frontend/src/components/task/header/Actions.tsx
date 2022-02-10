import { BLANK_CALENDAR_ICON, DEFAULT_ALLOCATION, EXPAND_ICON, LABEL_ICON, TIME_ICON } from '../../../constants'
import { ButtonIcon, DueDateButtonText, TimeEstimateButtonText } from './Header-style'
import { collapseBody, expandBody, hideDatePicker, hideLabelSelector, hideTimeEstimate, showDatePicker, showLabelSelector, showTimeEstimate } from '../../../redux/tasksPageSlice'
import { useAppDispatch, useAppSelector } from '../../../redux/hooks'

import { BACKGROUND_HOVER } from '../../../helpers/styles'
import DatePicker from './options/DatePicker'
import { Duration } from 'luxon'
import { InvisibleKeyboardShortcut } from '../../common/KeyboardShortcut'
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
    isSelected: boolean,
}
const ExpandAction = ({ isExpanded, taskId, isSelected }: ExpandActionProps): JSX.Element => {
    const dispatch = useAppDispatch()
    const toggleExpand = () => dispatch(isExpanded ? collapseBody() : expandBody(taskId))
    const onClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        toggleExpand()
    }
    return (
        <Tooltip text={'Expand/Collapse'}>
            <Action onClick={onClick}>
                <ButtonIcon src={EXPAND_ICON} alt="expand" />
            </Action>
            {isSelected && <InvisibleKeyboardShortcut shortcut='Enter' onKeyPress={toggleExpand} />}
        </Tooltip>
    )
}

interface TimeEstimateActionProps {
    sourceName: string,
    taskId: string,
    timeAllocated: number,
    isSelected: boolean,
}
const TimeEstimateAction = ({ sourceName, taskId, timeAllocated, isSelected }: TimeEstimateActionProps): JSX.Element => {
    if (sourceName !== 'General Task') return <></>
    const dispatch = useAppDispatch()

    const timeEstimate = useAppSelector((state) => state.tasks_page.tasks.time_estimate)
    const time_allocated_millis = isNaN(timeAllocated) ? 0 : timeAllocated
    const time_allocated = Duration.fromMillis(time_allocated_millis / 1000).shiftTo('hours', 'minutes')

    const toggleTimeEstimate = () => dispatch(timeEstimate === taskId ? hideTimeEstimate() : showTimeEstimate(taskId))
    const onClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        toggleTimeEstimate()
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
            {isSelected && <InvisibleKeyboardShortcut shortcut='F' onKeyPress={toggleTimeEstimate} />}
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
    isSelected: boolean,
}
const DueDateAction = ({ taskId, dueDate, isSelected }: DueDateActionProps): JSX.Element => {
    const datePicker = useAppSelector((state) => state.tasks_page.tasks.date_picker)
    const simpleDueDate = new Date(new Date(dueDate).valueOf() + 86400000)
        .toLocaleDateString('default', { day: 'numeric', month: 'short' })

    const dispatch = useAppDispatch()

    const toggleDatePicker = () => dispatch(datePicker === taskId ? hideDatePicker() : showDatePicker(taskId))
    const onClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        toggleDatePicker()
    }
    return (
        <>
            {isSelected && <InvisibleKeyboardShortcut shortcut='S' onKeyPress={toggleDatePicker} />}
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
    isSelected: boolean,
}
const LabelAction = ({ task, isSelected }: LabelActionProps): JSX.Element => {
    const labelSelector = useAppSelector((state) => state.tasks_page.tasks.label_selector)
    const dispatch = useAppDispatch()

    const toggleLabelSelector = () => dispatch(labelSelector === task.id ? hideLabelSelector() : showLabelSelector(task.id))
    const onClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        toggleLabelSelector()
    }
    return (
        <>
            {isSelected && <InvisibleKeyboardShortcut shortcut='L' onKeyPress={toggleLabelSelector} />}
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
    isOver: boolean,
    task: TTask
    isExpanded: boolean
    isSelected: boolean
}
const HeaderActions = (props: HeaderActionsProps) => {
    let actions: JSX.Element[] = []

    if (props.isOver || props.isSelected) {
        actions = [
            <TimeEstimateAction sourceName="General Task" taskId={props.task.id} timeAllocated={props.task.time_allocated} isSelected={props.isSelected} />,
            <DueDateAction taskId={props.task.id} dueDate={props.task.due_date} isSelected={props.isSelected} />,
            <LabelAction task={props.task} isSelected={props.isSelected} />,
            <ExpandAction isExpanded={props.isExpanded} taskId={props.task.id} isSelected={props.isSelected} />,
        ]
    }
    else {
        if (props.task.time_allocated < DEFAULT_ALLOCATION && props.task.time_allocated !== 0) {
            actions.push(<TimeEstimateAction sourceName="General Task" taskId={props.task.id} timeAllocated={props.task.time_allocated} isSelected={props.isSelected} />)
        }
        if (props.task.due_date !== '') {
            actions.push(<DueDateAction taskId={props.task.id} dueDate={props.task.due_date} isSelected={props.isSelected} />)
        }
    }

    return (
        <ActionContainer>
            {
                actions.map((component, index) => {
                    return <React.Fragment key={index}>{component}</React.Fragment>
                })
            }
        </ActionContainer >
    )
}


export default HeaderActions
