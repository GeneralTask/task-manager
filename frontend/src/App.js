import React, { useState } from 'react';
import { DragDropContext, resetServerContext } from "react-beautiful-dnd";
import data from './hardcoded-data';
import TaskContainer from './components/TaskContainer_drag.js';
import './App.css';
import { BrowserRouter, Route, Switch, Redirect } from "react-router-dom";

import {Provider} from 'react-redux';
import store from './redux/store';

import TaskList from "./components/task/TaskList";

resetServerContext()

function App() {

  const [order, setOrder] = useState(data);

  return (
    <Provider store={store}>
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
            <TaskList/>
          </Route>

          <Route path="/">
            <Redirect to="/tasks" />
          </Route>

        </Switch>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
