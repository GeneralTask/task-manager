import React, { useState } from 'react';
import { DragDropContext, resetServerContext } from "react-beautiful-dnd";
import data from './hardcoded-data';
import TaskContainer from './components/TaskContainer.js';
import './App.css';
import { BrowserRouter, Route, Switch } from "react-router-dom";

resetServerContext()


function App() {

  const [order, setOrder] = useState(data);

  return (
    <BrowserRouter>
      <Switch>
        <Route path="/dragTasks">
            <DragDropContext onDragEnd={() => {}}>
              {Object.entries(order.columns).map(([key, column]) => {
                return <TaskContainer key={column.id} column={column} tasks={order.tasks}></TaskContainer>
              })}
            </DragDropContext>
        </Route>
        
        <Route path="/tasks" >
          <TestTasks/>
        </Route>
      </Switch>
    </BrowserRouter>
  );
}

class TestTasks extends React.Component {
  render(){
    return(
      <div>i am task boo</div>
    )
  }
}

export default App;
