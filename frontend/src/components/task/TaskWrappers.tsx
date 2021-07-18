import React, { useEffect, useState } from 'react'
import { TTask, TTaskGroup } from '../../helpers/types'
import moment, { Moment } from 'moment'

import Task from './Task'
import { textDark } from '../../helpers/styles'
import styled from 'styled-components'

const TaskGroup = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center; 
  align-items: center;
  position: relative;
`
const Tasks = styled.div`
  width: 60%;
`
const UnscheduledSpanbar = styled.div`
  background-color: ${textDark};
  width: 2px;
  height: calc(100% - 10px);
  position: absolute;
`
const UnscheduledTimeSpacer = styled.div`
  margin-left: 20px;
`
const TimeAnnotation = styled.div`
  color: ${textDark};
  width: 20%;
  margin-left: 10px;
  margin-right: 10px;
  font-size: 18px;
  font-weight: 600;
`
const AlignRight = styled.div`
  text-align: right;
`
const UnscheduledTimeAnnotationContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  height: 100%;
`
const Divider = styled.div`
  margin-bottom: 15px;
`

interface TaskGroupProps {
  taskGroup: TTaskGroup,
}

interface TimeDurationProps {
  time_duration: number,
  datetime_start: string | null,
}

const ScheduledTask: React.FC<TaskGroupProps> = ({ taskGroup }: TaskGroupProps) =>
  <>
    <TaskGroup>
      <TimeAnnotation>
        <AlignRight>{momentFromDateTime(taskGroup.datetime_start).format('h:mm a')}</AlignRight>
      </TimeAnnotation>
      <Tasks>
        <Task
          task={taskGroup.tasks[0]}
          taskGroupIndex={0}
          isDragDisabled={true}
        />
      </Tasks>
      <TimeAnnotation>
        <TimeDuration
          time_duration={taskGroup.time_duration}
          datetime_start={taskGroup.datetime_start}
        />
      </TimeAnnotation>
    </TaskGroup>
    <Divider />
  </>


const UnscheduledTaskGroup: React.FC<TaskGroupProps> = ({ taskGroup }: TaskGroupProps) =>
  <>
    <TaskGroup>
      <TimeAnnotation />
      <Tasks>
        {taskGroup.tasks.map((task: TTask, taskGroupIndex) => (
          <Task task={task} key={task.id_ordering} taskGroupIndex={taskGroupIndex} isDragDisabled={false} />
        ))}
      </Tasks>
      <TimeAnnotation>
        <UnscheduledTimeAnnotationContainer>
          <UnscheduledSpanbar />
          <UnscheduledTimeSpacer />
          <TimeDuration
            time_duration={taskGroup.time_duration}
            datetime_start={taskGroup.datetime_start}
          />
        </UnscheduledTimeAnnotationContainer>
      </TimeAnnotation>
    </TaskGroup >
    <Divider />
  </>

const TimeDuration: React.FC<TimeDurationProps> = ({ time_duration, datetime_start }: TimeDurationProps) => {
  const duration = moment.duration(time_duration * 1000)
  const end = momentFromDateTime(datetime_start).add(duration)
  const hasStarted = moment().isAfter(momentFromDateTime(datetime_start))

  let initialTimeStr = ''
  if (hasStarted) {
    // this will update every second
    initialTimeStr = getLiveTimeStr(end)
  } else {
    // will show the full duration of the task ( 1 hour )
    initialTimeStr = getTimeStr(moment.duration(time_duration * 1000))
  }

  const [timeStr, setTimeStr] = useState(initialTimeStr)

  if (hasStarted) {
    useEffect(() => {
      const interval = setInterval(() => {
        setTimeStr(getLiveTimeStr(end))
      }, 1000)

      return () => {
        clearInterval(interval)
      }
    }, [])
  }
  return <div>{timeStr}</div>
}

const getTimeStr = (duration: moment.Duration): string => {
  let timeStr = ''
  let hours: number = duration.asHours()
  const minutes: number = Math.floor((hours % 1) * 60)
  hours = Math.floor(hours)
  if (hours >= 1) {
    hours = Math.floor(hours)
    if (hours > 1) {
      timeStr += hours + ' hours '
    } else {
      timeStr += hours + ' hour '
    }
  }
  if (minutes > 0) {
    if (minutes > 1) {
      timeStr += minutes + ' mins '
    } else {
      timeStr += minutes + ' min '
    }
  }
  if (hours === 0 && minutes < 1) {
    timeStr = '<1 min'
  }
  return timeStr
}

const getLiveTimeStr = (end: Moment): string => {
  return getTimeStr(moment.duration(end.diff(moment())))
}

const momentFromDateTime = (date_time: string | null): Moment => {
  return moment(date_time, 'YYYY-MM-DD HH:mm:ss ZZ')
}

export { ScheduledTask, UnscheduledTaskGroup }
