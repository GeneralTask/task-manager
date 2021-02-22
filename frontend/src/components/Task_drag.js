import React, { useState } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import styled from 'styled-components';

import TaskInternal from './TaskInternal';


const Container = styled.div`
  border: 1px solid black;
  border-radius: 2px;
  padding: 8px;
  margin-bottom: 8px;
  background-color: white;
  width: 200px;
`;


function Task(props) {
    const [title, setTitle] = useState(props.task.title);
    const [description, setDescription] = useState(props.task.description);

  
    function handleDone() {
      setTitle("Oopsie Test");
    }
  
    function handleNoTime() {
      setTitle("Oopsie no time");
    }
    return (
        <Draggable draggableId={props.task.id} index={parseInt(props.index)}>
            {provided => (
              <Container                
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                ref={provided.innerRef}
              >
                  <TaskInternal 
                    title={title} 
                    id={props.id} 
                    description={props.description} 
                  />
              </Container>            
            )}
        </Draggable>
    );
}

export default Task;
  