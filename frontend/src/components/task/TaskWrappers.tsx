import React, { useState, useEffect } from 'react'
import Task from './Task'
import styled from 'styled-components'
import moment, { Moment } from 'moment'
import { TTask } from '../../helpers/types'

const TaskGroup = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  position: relative;
  margin-bottom: 15px;
`
const Tasks = styled.div`
  width: 60%;
`
const UnscheduledSpanbar = styled.div`
  background-color: #969696;
  width: 2px;
  height: calc(100% - 10px);
  position: absolute;
`
const UnscheduledTimeSpacer = styled.div`
  margin-left: 20px;
`
const TimeAnnotation = styled.div`
  color: #969696;
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

interface ScheduledTaskProps {
  task: TTask,
  datetime_start: string | null,
  time_duration: number,
  next_time: Moment | null,
  index: number,
}

interface UnscheduledTaskProps {
  tasks: TTask[],
  time_duration: number,
  next_time: Moment | null,
  index: number,
}

interface TimeDurationProps {
  time_duration: number,
  next_time: Moment | null,
}

const ScheduledTask: React.FC<ScheduledTaskProps> = ({ task, datetime_start, time_duration, next_time, index }: ScheduledTaskProps) =>
  <TaskGroup>
    <TimeAnnotation>
      <AlignRight>{moment(datetime_start).format('h:mm a')}</AlignRight>
    </TimeAnnotation>
    <Tasks>
      <Task
        task={task}
        index={index}
        isDragDisabled={true}
      />
    </Tasks>
    <TimeAnnotation>
      <TimeDuration
        time_duration={time_duration}
        next_time={next_time}
      />
    </TimeAnnotation>
  </TaskGroup>

const UnscheduledTaskGroup: React.FC<UnscheduledTaskProps> = ({ tasks, time_duration, next_time }: UnscheduledTaskProps) =>
  <TaskGroup>
    <TimeAnnotation />
    <Tasks>
      {tasks.map((task: TTask, index: number) => (
        <Task task={task} key={task.id_ordering} index={index} isDragDisabled={false} />
      ))}
    </Tasks>
    <TimeAnnotation>
      <UnscheduledTimeAnnotationContainer>
        <UnscheduledSpanbar />
        <UnscheduledTimeSpacer />
        <TimeDuration
          time_duration={time_duration}
          next_time={next_time}
        />
      </UnscheduledTimeAnnotationContainer>
    </TimeAnnotation>
  </TaskGroup>

const TimeDuration: React.FC<TimeDurationProps> = ({ time_duration, next_time }: TimeDurationProps) => {
  let initialTimeStr: string = time_duration.toString()
  if (next_time) {
    // if this is the first task group (live updates)
    initialTimeStr = getLiveTimeStr(next_time)
  } else {
    // this is not the first task - time is formatted based off of task group duration in seconds
    initialTimeStr = getTimeStr(moment.duration(time_duration * 1000))
  }
  const [timeStr, setTimeStr] = useState(initialTimeStr)
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (next_time) {
      timer = setInterval(() => {
        setTimeStr(getLiveTimeStr(next_time))
      }, 1000)
    }
    return () => {
      if (timer) clearInterval()
    }
  }, [next_time])
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

const getLiveTimeStr = (next_time: Moment): string => {
  return getTimeStr(moment.duration(next_time.diff(moment())))
}

export { ScheduledTask, UnscheduledTaskGroup }
