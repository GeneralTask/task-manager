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

function ScheduledTask(props) {
  return (
    <TaskGroup>
      <TimeAnnotation>
        <AlignRight>{moment(props.datetime_start).format("h:mm a")}</AlignRight>
      </TimeAnnotation>
      <Tasks>
        <Task {...props} />
      </Tasks>
      <TimeAnnotation>
        <TimeDuration
          time_duration={props.time_duration}
          next_time={props.next_time}
        />
      </TimeAnnotation>
    </TaskGroup>
  );
}

function UnscheduledTaskGroup(props) {
  return (
    <TaskGroup>
      <TimeAnnotation />
      <Tasks>
        {props.tasks.map((task, index) => (
          <Task task={task} key={task.id_ordering} index={index} />
        ))}
      </Tasks>
      <TimeAnnotation>
        <UnscheduledTimeAnnotationContainer>
          <UnscheduledSpanbar />
          <UnscheduledTimeSpacer />
          <TimeDuration
            time_duration={props.time_duration}
            next_time={props.next_time}
          />
        </UnscheduledTimeAnnotationContainer>
      </TimeAnnotation>
    </TaskGroup>
  );
}

function TimeDuration(props) {
  let initialTimeStr = props.time_duration;
  if (props.next_time) {
    // if this is the first task group (live updates)
    initialTimeStr = getLiveTimeStr(props.next_time);
  } else {
    // this is not the first task - time is formatted based off of task group duration in seconds
    initialTimeStr = getTimeStr(moment.duration(props.time_duration * 1000));
  }
  const [timeStr, setTimeStr] = useState(initialTimeStr);
  useEffect(() => {
    let timer;
    if (props.next_time) {
      timer = setInterval(() => {
        setTimeStr(getLiveTimeStr(props.next_time));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval();
    };
  }, [props.next_time]);
  return <div>{timeStr}</div>;
}

function getTimeStr(duration) {
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

function getLiveTimeStr(next_time) {
  return getTimeStr(moment.duration(next_time.diff(moment())));
}

export { ScheduledTask, UnscheduledTaskGroup };
