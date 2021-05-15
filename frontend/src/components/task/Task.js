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
  &:hover ${Container}{
    background-color: #e3e3e3;
  }
`;

// renders <wrapper>children</wrapper> if condition is true, else just children
const ConditionalWrapper = ({ condition, wrapper, children }) =>
  condition ? wrapper(children) : children;

export default function Task(props) {
  return (
    <Draggable draggableId={props.task.id} index={props.index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <ConditionalWrapper
            condition={props.task.deeplink}
            wrapper={children => <Deeplink>{children}</Deeplink>}
            children={
              <Container
                onClick={() => {
                  if (props.task.deeplink) {
                    window.open(props.task.deeplink);
                  }
                }}
              >
                <TaskHeader
                  title={props.task.title}
                  icon_url={props.task.logo_url}
                  sender={props.task.sender}
                  provided={provided}
                />
              </Container>
            } />
        </div>
      )}
    </Draggable>
  );
}
