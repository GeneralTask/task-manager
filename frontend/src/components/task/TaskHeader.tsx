import './Task.css'
import { Action, Dispatch } from '@reduxjs/toolkit'
import { TASKS_MODIFY_URL, DONE_BUTTON, BLANK_CALENDAR_ICON, EXPAND_ICON, TIME_ICON } from '../../constants'
import React, { useCallback, useState } from 'react'
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
  DoneButton,
  ButtonRight,
  ButtonIcon,
  DueDateButtonText,
  TimeEstimateButtonText,
  DoneButtonContainer,
  ButtonRightContainer
} from './TaskHeader-style'
import { LogEvents } from '../../helpers/enums'
import { Duration } from 'luxon'

import TimeEstimate from './HeaderOptions/TimeEstimatePicker'
import DatePicker from './HeaderOptions/DatePicker'
import Tooltip from '../common/Tooltip'
import Domino from '../common/Domino'
import ContentEditable from 'react-contenteditable'

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

  const is_editable = props.task.source.name === 'General Task'

  const onClick = useCallback(() => {
    if (props.isExpanded) {
      dispatch(collapseBody())
      logEvent(LogEvents.TASK_COLLAPSED)
    } else {
      dispatch(expandBody(props.task.id))
      logEvent(LogEvents.TASK_EXPANDED)
    }
  }, [props.isExpanded])

  const onDoneButtonClick = useCallback(() => {
    done(props.task.id, dispatch, fetchTasks)
    logEvent(LogEvents.TASK_MARK_AS_DONE)
  }, [])

  // const handleTitleChange = (e: React.FormEvent<HTMLDivElement>) => {
  //   title_text.current = e.currentTarget.innerText
  //   console.log(title_text.current)
  // }

  const handleTitleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      e.currentTarget.blur()
    }
  }

  const handleTitleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    e.target.scrollLeft = 0
    makeAuthorizedRequest({
      url: TASKS_MODIFY_URL + props.task.id + '/',
      method: 'PATCH',
      body: JSON.stringify({ title: e.target.innerText }), //TODO: make this work
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('PATCH /tasks/modify failed: ' + response.text())
        }
      })
      .catch(e => {
        console.log({ e })
      })
  }

  const EditableTitle = (): JSX.Element => {
    // const titleRef = useRef()
    const [editableTitle, setEditableTitle] = useState(props.task.title)
    return (
      <ContentEditable
        // innerRef={titleRef}
        tagName='div'
        html={editableTitle}
        onKeyPress={handleTitleKeyPress}
        onChange={(e) => setEditableTitle(e.target.value)}
        onBlur={handleTitleBlur}
        // to prevent inputs from triggering keyboard shortcuts
        onKeyDown={(e) => e.stopPropagation()}
      />
    )
  }

  return (
    <TaskHeaderContainer showButtons={props.isExpanded} onClick={onClick}>
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
        {/* <Title isExpanded={props.isExpanded}
          isEditable={is_editable}
          // to prevent unnecessary warnings in the console
          suppressContentEditableWarning={true}
          contentEditable={is_editable}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => handleTitleChange(e)}
          onBlur={(e) => handleTitleBlur(e)}
          onKeyPress={(e) => handleTitleKeyPress(e)}
          // to prevent inputs from triggering keyboard shortcuts
          onKeyDown={e => e.stopPropagation()} >
          {props.task.title}
        </Title> */}
        <EditableTitle />
      </HeaderLeft>
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
