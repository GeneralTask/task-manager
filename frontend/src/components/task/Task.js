import React from "react";
import "./Task.css";
import TaskHeader from "./TaskHeader";
import { Draggable } from "react-beautiful-dnd";
import styled from "styled-components";

const Container = styled.div`
  padding: 0;
  font-family: "Gothic A1", sans-serif;
  border: 2px solid #cccccc;
  border-radius: 2px;
  margin: 5px 0;
  width: 100%;
  outline: none;
  background-color: white;
`;
const Deeplink = styled.div`
  cursor: pointer;
  &:hover ${Container} {
    background-color: #e3e3e3;
  }
`;

// renders <wrapper>children</wrapper> if condition is true, else just children
const ConditionalWrapper = ({ condition, wrapper, children }) =>
  condition ? wrapper(children) : children;

const Task = ({ task, index, isDragDisabled }) => (
  <Draggable draggableId={task.id} index={index}>
    {(provided) => (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
      >
        <ConditionalWrapper
          condition={task.deeplink}
          wrapper={(children) => <Deeplink>{children}</Deeplink>}
          children={
            <Container
              onClick={() => {
                if (task.deeplink) {
                  window.open(task.deeplink);
                }
              }}
            >
              <TaskHeader
                title={task.title}
                icon_url={task.logo_url}
                sender={task.sender}
                provided={provided}
              />
            </Container>
          }
        />
      </div>
    )}
  </Draggable>
);

export default Task;
