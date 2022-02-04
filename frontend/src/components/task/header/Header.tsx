import { Action, Dispatch } from '@reduxjs/toolkit'
import {
    ButtonIcon,
    ButtonRight,
    ButtonRightContainer,
    CalendarDate,
    CalendarIcon,
    CalendarIconContainer,
    DeadlineIndicator,
    DoneButton,
    DoneButtonContainer,
    DragHandler,
    DueDateButtonText,
    HeaderLeft,
    HeaderRight,
    Icon,
    TaskHeaderContainer,
    TimeEstimateButtonText
} from './Header-style'
import React, { useCallback } from 'react'
import { Duration } from 'luxon'
import { DONE_BUTTON, EXPAND_ICON, TIME_ICON, BLANK_CALENDAR_ICON, TASKS_MODIFY_URL } from '../../../constants'
import { LogEvents } from '../../../helpers/enums'
import { TTask } from '../../../helpers/types'
import { logEvent, makeAuthorizedRequest } from '../../../helpers/utils'
import { useAppDispatch, useAppSelector } from '../../../redux/hooks'
import { collapseBody, expandBody, hideTimeEstimate, showTimeEstimate, hideDatePicker, showDatePicker, removeTaskByID } from '../../../redux/tasksPageSlice'
import Domino from '../../common/Domino'
import { EditableTaskTitle } from '../../common/Title'
import Tooltip from '../../common/Tooltip'
import { useFetchTasks } from '../TasksPage'
import DatePicker from './options/DatePicker'
import TimeEstimate from './options/TimeEstimatePicker'


interface TaskHeaderProps {
    task: TTask
    dragDisabled: boolean
    isExpanded: boolean
}

const TaskHeader = React.forwardRef<HTMLDivElement, TaskHeaderProps>((props: TaskHeaderProps, ref) => {
    const dispatch = useAppDispatch()
    const fetchTasks = useFetchTasks()

    const date_picker = useAppSelector((state) => state.tasks_page.tasks.date_picker)
    const time_estimate = useAppSelector((state) => state.tasks_page.tasks.time_estimate)

    const time_allocated_millis = isNaN(props.task.time_allocated) ? 0 : props.task.time_allocated
    const time_allocated = Duration.fromMillis(time_allocated_millis / 1000).shiftTo('hours', 'minutes')
    const due_date = new Date(new Date(props.task.due_date).valueOf() + 86400000).toLocaleDateString('default', { day: 'numeric', month: 'short' })

    const today = new Date()
    const dd = today.getDate()
    const month = today.toLocaleDateString('default', { month: 'short' })

    const isEditable = props.task.source.name === 'General Task'

    const onDoneButtonClick = useCallback(() => {
        done(props.task.id, dispatch, fetchTasks)
        logEvent(LogEvents.TASK_MARK_AS_DONE)
    }, [])

    return (
        <TaskHeaderContainer showButtons={props.isExpanded}>
            <HeaderLeft>
                {
                    !props.dragDisabled &&
                    <DragHandler ref={ref} onClick={(e) => e.stopPropagation()}>
                        <Domino />
                    </DragHandler>
                }
                {
                    props.task.source.is_completable &&
                    <DoneButtonContainer>
                        <Tooltip text="Mark as done">
                            <DoneButton src={DONE_BUTTON} onClick={(e) => {
                                e.stopPropagation()
                                onDoneButtonClick()
                            }} />
                        </Tooltip>
                    </DoneButtonContainer>
                }
                <Icon src={props.task.source.logo} alt="icon"></Icon>
                <EditableTaskTitle task={props.task} isExpanded={props.isExpanded} isEditable={isEditable} />
            </HeaderLeft >
            <HeaderRight>
                {
                    <ButtonRightContainer>
                        <ButtonRight onClick={(e) => {
                            e.stopPropagation()
                            dispatch(props.isExpanded ? collapseBody() : expandBody(props.task.id))
                        }}>
                            <Tooltip text={'Expand/Collapse'}>
                                <ButtonIcon src={EXPAND_ICON} alt="expand" />
                            </Tooltip>
                        </ButtonRight>
                    </ButtonRightContainer>
                }
                {
                    props.task.source.name === 'General Task' &&
                    <>
                        <ButtonRightContainer>
                            <Tooltip text={'Time Estimate'}>
                                <ButtonRight onClick={(e) => {
                                    e.stopPropagation()
                                    dispatch(time_estimate === props.task.id ? hideTimeEstimate() : showTimeEstimate(props.task.id))
                                }}>
                                    {
                                        props.task.time_allocated >= 3600000000000 ?
                                            <ButtonIcon src={TIME_ICON} alt="time estimate" /> :
                                            <TimeEstimateButtonText>
                                                {
                                                    time_allocated.hours > 0 ?
                                                        `${time_allocated.hours}hr${time_allocated.minutes}m` :
                                                        `${time_allocated.minutes}m`
                                                }
                                            </TimeEstimateButtonText>
                                    }
                                </ButtonRight >
                            </Tooltip >
                        </ButtonRightContainer >
                        <ButtonRightContainer>
                            <Tooltip text={'Due Date'}>
                                <ButtonRight onClick={(e) => {
                                    e.stopPropagation()
                                    dispatch(date_picker === props.task.id ? hideDatePicker() : showDatePicker(props.task.id))

                                }}>
                                    {
                                        props.task.due_date === '' ?
                                            <ButtonIcon src={BLANK_CALENDAR_ICON} alt='due date' /> :
                                            <DueDateButtonText>{due_date}</DueDateButtonText>
                                    }
                                </ButtonRight>
                            </Tooltip>
                        </ButtonRightContainer>
                        {time_estimate === props.task.id && <TimeEstimate task_id={props.task.id} />}
                        {date_picker === props.task.id && <DatePicker task_id={props.task.id} due_date={props.task.due_date} />}
                    </>
                }

                <DeadlineIndicator>
                    <CalendarDate>{`${dd} ${month}`}</CalendarDate>
                    <CalendarIconContainer>
                        <CalendarIcon src="/images/calendar-icon.png" alt="calendar" />
                    </CalendarIconContainer>
                </DeadlineIndicator>
            </HeaderRight >
        </TaskHeaderContainer >
    )
})

const done = async (task_id: string, dispatch: Dispatch<Action<string>>, fetchTasks: () => void) => {
    try {
        dispatch(removeTaskByID(task_id))
        const response = await makeAuthorizedRequest({
            url: TASKS_MODIFY_URL + task_id + '/',
            method: 'PATCH',
            body: JSON.stringify({ is_completed: true }),
        })

        if (!response.ok) {
            throw new Error('PATCH /tasks/modify Mark as Done failed: ' + response.text())
        }
        await fetchTasks()
    } catch (e) {
        console.log({ e })
    }
}

export default TaskHeader
export type { TaskHeaderProps }
