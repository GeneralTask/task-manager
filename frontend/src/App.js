import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
  Link
} from "react-router-dom";
import './App.css';
import Cookies from 'js-cookie'

function App() {
  useEffect(() => {
    // Cookies.set('authToken', 'dummyToken')  // Remove this
  }, []);

  return (
    <div className="App">
      <Router>
        <Switch>
          <PrivateRoute path="/tasks" component={Tasks}/>
          <Route path="/" component={Home}/>
        </Switch>
      </Router>
    </div>
  );
}

const PrivateRoute = ({ component: Component, ...rest }) => (
  <Route {...rest} render={(props) => (
    Cookies.get('authToken')
      ? <Component {...props} />
      : <Redirect to='/' />
  )} />
)

function Home() {
  if (Cookies.get('authToken')) {
    return <Redirect to='/tasks' />
  }
  return (
    <div id="home">
      <h1>General Task</h1>
      <h2>Welcome to the landing page!</h2>
      <Link to="/tasks"> See Tasks </Link>
    </div>
  );
}

function Tasks() {
  return <h2>Tasks</h2>;
}

export default App;
