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

export default function Task(props) {
  return (
    <Draggable draggableId={props.task.id} index={props.index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <div className={props.task.deeplink ? "deeplink" : ""}>
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
          </div>
        </div>
      )}
    </Draggable>
  );
}
