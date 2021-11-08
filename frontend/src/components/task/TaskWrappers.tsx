import { DateTime, Duration } from 'luxon'
import { DeviceSize, useDeviceSize } from '../../helpers/utils'
import React, { useEffect, useState } from 'react'
import { TEXT_GRAY, device } from '../../helpers/styles'
import { TTask, TTaskGroup } from '../../helpers/types'

import Task from './Task'
import humanizeDuration from 'humanize-duration'
import styled from 'styled-components'

const short_en_expanded = {
  y: (c: number | undefined) => 'year' + (c === 1 ? '' : 's'),
  mo: (c: number | undefined) => 'month' + (c === 1 ? '' : 's'),
  w: (c: number | undefined) => 'week' + (c === 1 ? '' : 's'),
  d: (c: number | undefined) => 'day' + (c === 1 ? '' : 's'),
  h: (c: number | undefined) => 'hour' + (c === 1 ? '' : 's'),
  m: (c: number | undefined) => 'min' + (c === 1 ? '' : 's'),
  s: (c: number | undefined) => 'second' + (c === 1 ? '' : 's'),
  ms: (c: number | undefined) => 'millisecond' + (c === 1 ? '' : 's'),
}

const short_en_condensed = {
  y: () => 'yr',
  mo: () => 'mo',
  w: () => 'wk',
  d: () => 'd',
  h: () => 'hr',
  m: () => 'm',
  s: () => 's',
  ms: () => 'ms',
}

const TaskGroup = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center; 
  align-items: center;
  position: relative;
`
const Tasks = styled.div`
  width: 70%;
  @media ${device.mobile}{
    width: 60%;
  }
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
  font-size: 16px;
  font-weight: 600;
  & > * {
    margin-left: 10px;
    margin-right: 10px;
  }
  width: 15%;
  @media ${device.mobile}{
    width: 20%;
  }
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
          dragDropDisabled={true}/>
      </Tasks>
      <TimeAnnotation>
        <div>
          {showTimeAnnotations && time}
        </div>
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
        {taskGroup.tasks.map((task: TTask) => (
          <Task task={task} datetimeStart={null} dragDropDisabled={false} key={task.id}/>
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
  const isMobile = useDeviceSize() === DeviceSize.MOBILE

  const start = parseDateTime(datetimeStart)

  const [time, setTime] = useState<string | null>(getLiveTimeStr(start, isMobile))
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getLiveTimeStr(start, isMobile))
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  if (DateTime.now() > start) {
    return null
  }
  return time
}

// if the time task has not started, show the duration.
// if the task has started, show the time remaining.
// if the task is over, show nothing
export function useTimeDuration(
  time_duration: number,
  datetime_start: string | null,
  alwaysShowTimeRemaining = false,
): string | null {
  const isMobile = useDeviceSize() === DeviceSize.MOBILE

  const duration = Duration.fromMillis(time_duration * 1000)
  const start = parseDateTime(datetime_start)
  const end = start.plus(duration)
  const hasStarted = DateTime.now() > start
  const hasEnded = DateTime.now() > end

  let initialTimeStr = ''
  if (hasStarted && !hasEnded) {
    // this will update every second
    initialTimeStr = getLiveTimeStr(end, isMobile)
  } else {
    // will show the full duration of the task ( 1 hour )
    initialTimeStr = getTimeStringFromDuration(duration, isMobile)
  }

  const [timeStr, setTimeStr] = useState(initialTimeStr)

  useEffect(() => {
    setTimeStr(getLiveTimeStr(end, isMobile))
    const interval = setInterval(() => {
      if ((hasStarted && !hasEnded) || alwaysShowTimeRemaining) {
        setTimeStr(getLiveTimeStr(end, isMobile))
      } else {
        setTimeStr(getTimeStringFromDuration(duration, isMobile))
      }
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [isMobile])
  return timeStr
}

const getLiveTimeStr = (dtEnd: DateTime, condensed=false): string => {
  return getTimeStringFromDuration(dtEnd.diffNow(), condensed)
}

const getTimeStringFromDuration = (dur: Duration, condensed=false): string => {
  const shortEnglishHumanizer = humanizeDuration.humanizer({
    language: 'short_en',
    languages: {
      short_en: condensed ? short_en_condensed : short_en_expanded,
    },
  })
  return shortEnglishHumanizer(dur.toMillis(), { units: ['d', 'h', 'm'], largest: 2, delimiter: ' ', round: true, language: 'short_en', })
}

const parseDateTime = (date_time: string | null): DateTime => {
  return DateTime.fromISO(date_time || '')
}

export { ScheduledTask, UnscheduledTaskGroup }
