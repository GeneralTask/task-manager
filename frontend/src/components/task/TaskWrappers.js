import { React, useState, useEffect } from "react";
import Task from "./Task";
import styled from "styled-components";
import moment from "moment";

const TaskGroup = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  position: relative;
  margin-bottom: 15px;
`;
const Tasks = styled.div`
  width: 60%;
`;
const UnscheduledSpanbar = styled.div`
  background-color: #969696;
  width: 2px;
  height: calc(100% - 10px);
  position: absolute;
`;
const UnscheduledTimeSpacer = styled.div`
  margin-left: 20px;
`;
const TimeAnnotation = styled.div`
  color: #969696;
  width: 20%;
  margin-left: 10px;
  margin-right: 10px;
  font-size: 18px;
  font-weight: 600;
`;
const AlignRight = styled.div`
  text-align: right;
`;
const UnscheduledTimeAnnotationContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  height: 100%;
`;

const ScheduledTask = ({datetime_start, time_duration, next_time, ...rest}) => 
    <TaskGroup>
      <TimeAnnotation>
        <AlignRight>{moment(datetime_start).format("h:mm a")}</AlignRight>
      </TimeAnnotation>
      <Tasks>
        <Task 
            datetime_start={datetime_start} 
            time_duration={time_duration} 
            next_time={next_time}
            isDragDisabled={true}
            {...rest}
        />
      </Tasks>
      <TimeAnnotation>
        <TimeDuration
          time_duration={time_duration}
          next_time={next_time}
        />
      </TimeAnnotation>
    </TaskGroup>

const UnscheduledTaskGroup = ({tasks, time_duration, next_time}) =>
    <TaskGroup>
      <TimeAnnotation />
      <Tasks>
        {tasks.map((task, index) => (
          <Task task={task} key={task.id_ordering} index={index} isDragDisabled={false}/>
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

const TimeDuration = ({time_duration, next_time}) => {
    let initialTimeStr = time_duration;
  if (next_time) {
    // if this is the first task group (live updates)
    initialTimeStr = getLiveTimeStr(next_time);
  } else {
    // this is not the first task - time is formatted based off of task group duration in seconds
    initialTimeStr = getTimeStr(moment.duration(time_duration * 1000));
  }
  const [timeStr, setTimeStr] = useState(initialTimeStr);
  useEffect(() => {
    let timer;
    if (next_time) {
      timer = setInterval(() => {
        setTimeStr(getLiveTimeStr(next_time));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval();
    };
  }, [next_time]);
  return <div>{timeStr}</div>;
}

const getTimeStr = (duration) => {
    let timeStr = "";
  let hours = duration.asHours();
  const minutes = Math.floor((hours % 1) * 60);
  hours = Math.floor(hours);
  if (hours >= 1) {
    hours = Math.floor(hours);
    if (hours > 1) {
      timeStr += hours + " hours ";
    } else {
      timeStr += hours + " hour ";
    }
  }
  if (minutes > 0) {
    if (minutes > 1) {
      timeStr += minutes + " mins ";
    } else {
      timeStr += minutes + " min ";
    }
  }
  if (hours === 0 && minutes < 1) {
    timeStr = "<1 min";
  }
  return timeStr;
}

const getLiveTimeStr = (next_time) => 
    getTimeStr(moment.duration(next_time.diff(moment())));

export { ScheduledTask, UnscheduledTaskGroup };
