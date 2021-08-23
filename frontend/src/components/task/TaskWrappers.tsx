import React, { useEffect, useState } from 'react'
import { TTask, TTaskGroup } from '../../helpers/types'
import moment, { Moment } from 'moment'

import { TEXT_GRAY } from '../../helpers/styles'
import Task from './Task'
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
  background-color: ${TEXT_GRAY};
  width: 2px;
  height: calc(100% - 10px);
  position: absolute;
`
const UnscheduledTimeSpacer = styled.div`
  margin-left: 20px;
`
const TimeAnnotation = styled.div`
  color: ${TEXT_GRAY};
  width: 15%;
  margin-left: 10px;
  margin-right: 10px;
  font-size: 16px;
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
  showTimeAnnotations: boolean,
}

const ScheduledTask: React.FC<TaskGroupProps> = ({ taskGroup, showTimeAnnotations }: TaskGroupProps) => {
  const time = useTimeDuration(taskGroup.time_duration, taskGroup.datetime_start)
  return <>
    <TaskGroup>
      <TimeAnnotation>
        <AlignRight>{momentFromDateTime(taskGroup.datetime_start).format('h:mm a')}</AlignRight>
      </TimeAnnotation>
      <Tasks>
        <Task
          task={taskGroup.tasks[0]}
          datetimeStart={taskGroup.datetime_start}
          taskGroupIndex={0}
          isDragDisabled={true}
        />
      </Tasks>
      <TimeAnnotation>
        {showTimeAnnotations && time}
      </TimeAnnotation>
    </TaskGroup>
    <Divider />
  </>
}


const UnscheduledTaskGroup: React.FC<TaskGroupProps> = ({ taskGroup, showTimeAnnotations }: TaskGroupProps) => {
  const time = useTimeDuration(taskGroup.time_duration, taskGroup.datetime_start)
  return <>
    <TaskGroup>
      <TimeAnnotation />
      <Tasks>
        {taskGroup.tasks.map((task: TTask, taskGroupIndex) => (
          <Task task={task} datetimeStart={null} taskGroupIndex={taskGroupIndex} isDragDisabled={false} key={taskGroupIndex} />
        ))}
      </Tasks>
      <TimeAnnotation>
        {showTimeAnnotations &&
          <UnscheduledTimeAnnotationContainer>
            <UnscheduledSpanbar />
            <UnscheduledTimeSpacer />
            {time}
          </UnscheduledTimeAnnotationContainer>
        }
      </TimeAnnotation>
    </TaskGroup >
    <Divider />
  </>
}

// hook that returns countdown until datetimeStart if it has not started, otherwise returns null
export function useCountdown(datetimeStart: string | null): string | null {
  if (datetimeStart == null) {
    return null
  }

  const start = momentFromDateTime(datetimeStart)
  const now = moment()
  if (now.isAfter(start)) {
    return null
  }

  const [time, setTime] = useState<string | null>(getLiveTimeStr(start))
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getLiveTimeStr(start))
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [])
  return time
}

// if the time task has not started, show the duration.
// if the task has started, show the time remaining.
export function useTimeDuration(
  time_duration: number,
  datetime_start: string | null,
  alwaysShowTimeRemaining = false,
): string {
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

  if (hasStarted || alwaysShowTimeRemaining) {
    useEffect(() => {
      const interval = setInterval(() => {
        setTimeStr(getLiveTimeStr(end))
      }, 1000)

      return () => {
        clearInterval(interval)
      }
    }, [])
  }
  return timeStr
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
