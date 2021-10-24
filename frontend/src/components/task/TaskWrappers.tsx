import React, { useEffect, useState } from 'react'
import { TTask, TTaskGroup } from '../../helpers/types'
import { DateTime, Duration } from 'luxon'
import humanizeDuration from 'humanize-duration'

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
        <AlignRight>{parseDateTime(taskGroup.datetime_start).toLocaleString(DateTime.TIME_SIMPLE)}</AlignRight>
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

  const start = parseDateTime(datetimeStart)
  if (DateTime.now() > start) {
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
// if the task is over, show nothing
export function useTimeDuration(
  time_duration: number,
  datetime_start: string | null,
  alwaysShowTimeRemaining = false,
): string {
  // const duration = moment.duration(time_duration * 1000)
  // const end = momentFromDateTime(datetime_start).add(duration)
  // const hasStarted = moment().isAfter(momentFromDateTime(datetime_start))
  const duration = Duration.fromMillis(time_duration * 1000)
  const start = parseDateTime(datetime_start)
  const end = start.plus(duration)
  const hasStarted = DateTime.now() > start
  const hasEnded = DateTime.now() > end

  let initialTimeStr = ''
  if (hasEnded) {
    return ''
  } else if (hasStarted) {
    // this will update every second
    initialTimeStr = getLiveTimeStr(end)
  } else {
    // will show the full duration of the task ( 1 hour )
    initialTimeStr = getTimeStringFromDuration(duration)
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

const getLiveTimeStr = (dtEnd: DateTime): string => {
  return getTimeStringFromDuration(dtEnd.diffNow())
}

const getTimeStringFromDuration = (dur: Duration): string => {
  const shortEnglishHumanizer = humanizeDuration.humanizer({
    language: 'sen',
    languages: {
      sen: {
        y: () => 'years',
        mo: () => 'months',
        w: () => 'weeks',
        d: () => 'days',
        h: () => 'hours',
        m: () => 'mins',
        s: () => 'seconds',
        ms: () => 'ms',
      },
    },
  })
  return shortEnglishHumanizer(dur.toMillis(), { largest: 2, delimiter: ' ', language: 'sen' })
}

const parseDateTime = (date_time: string | null): DateTime => {
  return DateTime.fromISO(date_time || '')
}

export { ScheduledTask, UnscheduledTaskGroup }
