import React, { useEffect } from 'react';
import { DragDropContext, resetServerContext } from "react-beautiful-dnd";
import data from './hardcoded-data';
import './App.css';
import { BrowserRouter, Route, Switch, Redirect, Link } from "react-router-dom";
import Cookies from 'js-cookie'

import {Provider} from 'react-redux';
import store from './redux/store';

import TaskList from "./components/task/TaskList";

resetServerContext()

function App() {
  useEffect(() => {
    // Cookies.set('authToken', 'dummyToken')  // Remove this
  }, []);

  return (
    <Provider store={store}>
      <BrowserRouter>
        <Switch>

          <Route exact path="/" component={Home}/>
          <Route path="/tasks" component={TaskList}/>
          <PrivateRoute path="/protectedRoute" component={TaskList}/>

        </Switch>
      </BrowserRouter>
    </Provider>
  );
}

const PrivateRoute = ({ component: Component, ...rest }) => (
  <Route {...rest} render={(props) => (
    Cookies.get('authToken')
      ? <Component {...props} />
      : <Redirect to='/' />
  )} />
);

function Home() {
  if (Cookies.get('authToken')) {
    return <Redirect to='/tasks' />
  }
  return (
    <div id="home">
      <h1>General Task</h1>
      <h2>Welcome to the landing page!</h2>
      <Link to="/tasks"> See Tasks </Link>
      <br />
      <Link to="/protectedRoute">Try a Protected Route</Link>
    </div>
  )
}

export default App;
