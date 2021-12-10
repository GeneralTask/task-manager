import './Task.css'
import { Action, Dispatch } from '@reduxjs/toolkit'
import { TASKS_MODIFY_URL } from '../../constants'
import React, { useCallback } from 'react'
import { collapseBody, expandBody, removeTaskByID } from '../../redux/tasksPageSlice'
import { makeAuthorizedRequest, useFetchTasks } from '../../helpers/utils'
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
  Domino,
  DoneButton
} from './TaskHeader-style'

interface Props {
  task: TTask,
  datetimeStart: string | null, // null if unscheduled_task
  dragDisabled: boolean,
  isExpanded: boolean,
}

const TaskHeader = React.forwardRef<HTMLDivElement, Props>((props: Props, ref) => {
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
      }
      else {
        dispatch(expandBody(props.task.id))
      }
    }
  }, [hoverEffectEnabled, props.isExpanded])

  return (
    <TaskHeaderContainer hoverEffect={hoverEffectEnabled} showButtons={props.isExpanded} onClick={onClick}>
      <HeaderLeft>
        <Icon src={props.task.source.logo} alt="icon"></Icon>
        <Title>{props.task.title}</Title>
      </HeaderLeft>
      <HeaderRight>
        <DeadlineIndicator>
          <CalendarDate>{`${dd} ${month}`}</CalendarDate>
          <CalendarIconContainer>
            <CalendarIcon src="images/calendar-icon.png" alt="calendar" />
          </CalendarIconContainer>
        </DeadlineIndicator>
        {
          props.isExpanded ?
            props.task.source.is_completable && <DoneButton onClick={() => {
              done(props.task.id, dispatch, fetchTasks)
            }}>
            </DoneButton> :
            <DragHandler ref={ref}>
              <Domino src="images/domino.svg" alt="" />
            </DragHandler>
        }
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

export default TaskHeader
