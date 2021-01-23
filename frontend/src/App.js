import React, { useState } from 'react';
import { DragDropContext } from "react-beautiful-dnd";
import data from './hardcoded-data';
import TaskContainer from './components/TaskContainer.js';
import './App.css';
import { resetServerContext } from "react-beautiful-dnd"

resetServerContext()


function App() {

  const [order, setOrder] = useState(data);

  return (
      <DragDropContext onDragEnd={() => {}}>
        {Object.entries(order.columns).map(([key, column]) => {
          return <TaskContainer key={column.id} column={column} tasks={order.tasks}></TaskContainer>
        })}
      </DragDropContext>
  );
}

export default App;
