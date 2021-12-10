import { DateTime, Duration } from 'luxon'
import { DeviceSize, useDeviceSize } from '../../helpers/utils'
import React, { useCallback, useEffect, useState } from 'react'
import { TEXT_GRAY, device } from '../../helpers/styles'
import { TTask, TTaskGroup } from '../../helpers/types'
import styled, { css } from 'styled-components'

import { NOW } from '../../constants'
import TaskDropContainer from './TaskDropContainer'
import humanizeDuration from 'humanize-duration'

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
  margin-bottom: 15px;
`

const Tasks = styled.div`
  width: 100%;
  display:flex;
  flex-direction: column;
`
const TimeAnnotation = css`
  display: flex;
  align-items: center;
  color: ${TEXT_GRAY};
  font-size: 16px;
  font-weight: 600;
  position: absolute;
  width: 15%;
  @media ${device.mobile}{
      width: 20%;
  }
  height: 100%;
  pointer-events: none;
`
const TimeAnnotationLeft = styled.div`
  ${TimeAnnotation};
  left: 0;
`
const AlignRight = styled.div`
  margin-left: auto;
  padding-right: 10px;
  text-align: right;
`

interface TaskGroupProps {
  taskGroup: TTaskGroup,
  indices: {
    group: number,
    section: number,
  }
}

const ScheduledTask: React.FC<TaskGroupProps> = ({ taskGroup, indices }: TaskGroupProps) => {
  return (
    <TaskGroup>
      <Tasks>
        <TaskDropContainer task={taskGroup.tasks[0]} dragDisabled={true} indices={{ ...indices, task: 0 }} />
      </Tasks>
    </TaskGroup >
  )
}



const UnscheduledTaskGroup: React.FC<TaskGroupProps> = ({ taskGroup, indices }: TaskGroupProps) => {
  return (
    <TaskGroup>
      <Tasks>
        {taskGroup.tasks.map((task: TTask, index) => (
          <TaskDropContainer
            key={task.id}
            task={task}
            dragDisabled={false}
            indices={{ ...indices, task: index }}
          />
        ))}
      </Tasks>
    </TaskGroup >
  )
}

// hook that returns countdown until datetimeStart if it has not started, otherwise returns null
export function useCountdown(datetimeStart: string | null): string | null {
  if (datetimeStart == null) {
    return null
  }
  const isMobile = useDeviceSize() === DeviceSize.MOBILE

  const start = parseDateTime(datetimeStart)

  const getTimeStr = useCallback(() => {
    if (DateTime.now() > start) {
      setTime(NOW)
    }
    else {
      setTime(getLiveTimeStr(start, isMobile))
    }
  }, [start, isMobile])

  const [time, setTime] = useState<string>('')
  useEffect(() => {
    getTimeStr()
    const interval = setInterval(getTimeStr, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [isMobile, datetimeStart])

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

  const getTimeStr = useCallback(() => {
    if ((hasStarted && !hasEnded) || alwaysShowTimeRemaining) {
      // this will update every second
      return getLiveTimeStr(end, isMobile)
    } else {
      // will show the full duration of the task ( 1 hour )
      return getTimeStringFromDuration(duration, isMobile)
    }
  }, [isMobile, time_duration, datetime_start, alwaysShowTimeRemaining])

  const [timeStr, setTimeStr] = useState(getTimeStr())

  useEffect(() => {
    setTimeStr(getTimeStr())
    const interval = setInterval(() => {
      setTimeStr(getTimeStr())
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [isMobile, time_duration, datetime_start, alwaysShowTimeRemaining])
  return timeStr
}

const getLiveTimeStr = (dtEnd: DateTime, condensed = false): string => {
  return getTimeStringFromDuration(dtEnd.diffNow(), condensed)
}

const getTimeStringFromDuration = (dur: Duration, condensed = false): string => {
  const shortEnglishHumanizer = humanizeDuration.humanizer({
    language: 'short_en',
    languages: {
      short_en: condensed ? short_en_condensed : short_en_expanded,
    },
  })
  return shortEnglishHumanizer(
    dur.toMillis(),
    {
      units: ['d', 'h', 'm'],
      largest: 2,
      delimiter: ' ',
      round: true,
      language: 'short_en',
      spacer: condensed ? '' : ' ',
    })
}

const parseDateTime = (date_time: string | null): DateTime => {
  return DateTime.fromISO(date_time || '')
}

export { ScheduledTask, UnscheduledTaskGroup }
