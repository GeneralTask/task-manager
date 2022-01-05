import './Task.css'
import { Action, Dispatch } from '@reduxjs/toolkit'
import { TASKS_MODIFY_URL, DONE_BUTTON, BLANK_CALENDAR_ICON, EXPAND_ICON, TIME_ICON } from '../../constants'
import React, { useCallback } from 'react'
import { collapseBody, expandBody, removeTaskByID } from '../../redux/tasksPageSlice'
import { logEvent, makeAuthorizedRequest } from '../../helpers/utils'
import { useFetchTasks } from './TasksPage'
import { TTask } from '../../helpers/types'
import { useAppDispatch } from '../../redux/hooks'
import {
  TaskHeaderContainer,
  HeaderLeft,
  Icon,
  Title,
  HeaderRight,
  DeadlineIndicator,
  CalendarDate,
  CalendarIconContainer,
  CalendarIcon,
  DragHandler,
  DominoContainer,
  DominoDot,
  DoneButton,
  ButtonRight
} from './TaskHeader-style'
import { LogEvents } from '../../redux/enums'

function Domino(): JSX.Element {
  return (
    <DominoContainer data-testid="domino-handler" >
      {Array(6).fill(0).map((_, index) => <DominoDot key={index} />)}
    </DominoContainer>
  )
}
interface TaskHeaderProps {
  task: TTask,
  dragDisabled: boolean,
  isExpanded: boolean,
}

const TaskHeader = React.forwardRef<HTMLDivElement, TaskHeaderProps>((props: TaskHeaderProps, ref) => {
  const dispatch = useAppDispatch()
  const fetchTasks = useFetchTasks()

  const today = new Date()
  const dd = today.getDate()
  const month = today.toLocaleDateString('default', { month: 'short' })

  const hoverEffectEnabled = !!(props.task.body || props.task.deeplink)
  const onClick = useCallback(() => {
    if (hoverEffectEnabled) {
      if (props.isExpanded) {
        dispatch(collapseBody())
        logEvent(LogEvents.TASK_COLLAPSED)
      }
      else {
        dispatch(expandBody(props.task.id))
        logEvent(LogEvents.TASK_EXPANDED)
      }
    }
  }, [hoverEffectEnabled, props.isExpanded])

  const onDoneButtonClick = useCallback(() => {
    done(props.task.id, dispatch, fetchTasks)
    logEvent(LogEvents.TASK_MARK_AS_DONE)
  }, [])

  return (
    <TaskHeaderContainer hoverEffect={hoverEffectEnabled} showButtons={props.isExpanded} onClick={onClick}>
      <HeaderLeft>
        {
          !props.dragDisabled &&
          <DragHandler ref={ref}>
            <Domino />
          </DragHandler>
        }
        {
          !props.isExpanded &&
          props.task.source.is_completable &&
          <DoneButton src={DONE_BUTTON} onClick={onDoneButtonClick} />
        }
        <Icon src={props.task.source.logo} alt="icon"></Icon>
        <Title isExpanded={props.isExpanded}>{props.task.title}</Title>
      </HeaderLeft>
      <HeaderRight>
        <ButtonRight src={EXPAND_ICON} onClick={() => {
          // TODO: expand/collapse task body
          dispatch(props.isExpanded ? collapseBody() : expandBody(props.task.id))
        }} />
        <ButtonRight src={TIME_ICON} onClick={() => {
          // TODO: allow editing of task time estimate
          editTimeEstimate(props.task.id, dispatch, fetchTasks)
        }} />
        <ButtonRight src={BLANK_CALENDAR_ICON} onClick={() => {
          // TODO: allow editing of task due date
          editDueDate(props.task.id, dispatch, fetchTasks)
        }} />
        {/* <ButtonRight src={TRASH_ICON} onClick={() => {
          deleteTask(props.task.id, dispatch, fetchTasks)
        }} /> */}
        <DeadlineIndicator>
          <CalendarDate>{`${dd} ${month}`}</CalendarDate>
          <CalendarIconContainer>
            <CalendarIcon src="images/calendar-icon.png" alt="calendar" />
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
      body: JSON.stringify({ 'is_completed': true })
    })

    if (!response.ok) {
      throw new Error('PATCH /tasks/modify Mark as Done failed: ' + response.text())
    }
    await fetchTasks()
  } catch (e) {
    console.log({ e })
  }
}

const editDueDate = async (task_id: string, dispatch: Dispatch<Action<string>>, fetchTasks: () => void) => {
  // TODO: show date picker
}

const editTimeEstimate = async (task_id: string, dispatch: Dispatch<Action<string>>, fetchTasks: () => void) => {
  try {
    const response = await makeAuthorizedRequest({
      url: TASKS_MODIFY_URL + task_id + '/',
      method: 'PATCH',
      body: JSON.stringify({ 'time_estimate': '1' })
    })

    if (!response.ok) {
      throw new Error('PATCH /tasks/modify Edit Time Estimate failed: ' + response.text())
    }
    await fetchTasks()
  } catch (e) {
    console.log({ e })
  }
}

export default TaskHeader
export type { TaskHeaderProps }
