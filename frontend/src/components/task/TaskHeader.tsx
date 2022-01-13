import './Task.css'
import { Action, Dispatch } from '@reduxjs/toolkit'
import { TASKS_MODIFY_URL, DONE_BUTTON, BLANK_CALENDAR_ICON, EXPAND_ICON, TIME_ICON } from '../../constants'
import React, { useCallback } from 'react'
import { collapseBody, expandBody, removeTaskByID, hideDatePicker, hideTimeEstimate, showDatePicker, showTimeEstimate } from '../../redux/tasksPageSlice'
import { logEvent, makeAuthorizedRequest } from '../../helpers/utils'
import { useFetchTasks } from './TasksPage'
import { TTask } from '../../helpers/types'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
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
  ButtonRight,
  ButtonIcon,
  DueDateButtonText,
  TimeEstimateButtonText
} from './TaskHeader-style'
import { LogEvents } from '../../redux/enums'
import DatePicker from '../calendar/DatePicker'
import TimeEstimate from '../calendar/TimeEstimate'
import { Duration } from 'luxon'

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
  isDatePickerVisible: boolean,
}

const TaskHeader = React.forwardRef<HTMLDivElement, TaskHeaderProps>((props: TaskHeaderProps, ref) => {
  const dispatch = useAppDispatch()
  const fetchTasks = useFetchTasks()

  const date_picker = useAppSelector((state) => state.tasks_page.tasks.date_picker)
  const time_estimate = useAppSelector((state) => state.tasks_page.tasks.time_estimate)

  const time_allocated_millis = isNaN(props.task.time_allocated / 1000) ? 0 : props.task.time_allocated / 1000
  const time_allocated = Duration.fromMillis(time_allocated_millis).shiftTo('hours', 'minutes')
  const due_date = new Date(new Date(props.task.due_date).valueOf() + 86400000).toLocaleDateString('default', { day: 'numeric', month: 'short' })
  
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
          <DragHandler ref={ref} onClick={(e) => e.stopPropagation()}>
            <Domino />
          </DragHandler>
        }
        {
          props.task.source.is_completable &&
          <DoneButton src={DONE_BUTTON} onClick={onDoneButtonClick} />
        }
        <Icon src={props.task.source.logo} alt="icon"></Icon>
        <Title isExpanded={props.isExpanded} onClick={(e) => e.stopPropagation()}>{props.task.title} </Title>
      </HeaderLeft>
      <HeaderRight>
        <ButtonRight onClick={(e) => {
          e.stopPropagation()
          dispatch(props.isExpanded ? collapseBody() : expandBody(props.task.id))
        }}>
          <ButtonIcon src={EXPAND_ICON} alt="expand" />
        </ButtonRight>
        <ButtonRight onClick={(e) => {
          e.stopPropagation()
          dispatch(time_estimate === props.task.id ? hideTimeEstimate() : showTimeEstimate(props.task.id))
        }}>
          {
            props.task.time_allocated > 3600000000000 ? 
            <ButtonIcon src={TIME_ICON} alt="time estimate"/> :
            <TimeEstimateButtonText>
              {
                time_allocated.hours > 0 ?
                `${time_allocated.hours}hr${time_allocated.minutes}m` :
                `${time_allocated.minutes}m`
              }
            </TimeEstimateButtonText>
          }
        </ButtonRight>
        <ButtonRight onClick={(e) => {
          e.stopPropagation()
          dispatch(date_picker === props.task.id ? hideDatePicker() : showDatePicker(props.task.id))

        }}>
          {
            props.task.due_date === '1969-12-31' ? 
            <ButtonIcon src={BLANK_CALENDAR_ICON} alt='due date'/> :
            <DueDateButtonText>{due_date}</DueDateButtonText>
          }
        </ButtonRight>

        { time_estimate === props.task.id && <TimeEstimate task_id={props.task.id}/> }
        { date_picker === props.task.id && <DatePicker task_id={props.task.id} /> }

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

export default TaskHeader
export type { TaskHeaderProps }
