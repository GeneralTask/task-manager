import { resetServerContext } from "react-beautiful-dnd";
import './App.css';
import { MemoryRouter, Route, Switch, Redirect, Link } from "react-router-dom";
import Cookies from 'js-cookie'
import { Provider } from 'react-redux';
import store from './redux/store';

import TaskList from "./components/task/TaskList"
import Header from "./components/Header"
import Settings from "./components/settings/Settings"

resetServerContext()

function App() {
  return (
    <Provider store={store}>
      <MemoryRouter>
      <Header/>
        <Switch>

          {/* landing page route */}
          <Route exact path="/" component={Home}/>

          {/* task page route, should be changed to PrivateRoute once login is functional */}
          <Route path="/tasks" component={TaskList}/> 

          {/* task page route, should be changed to PrivateRoute once login is functional */}
          <Route path="/settings" component={Settings}/> 

          {/* Demo to show PrivateRoute protection */}
          <PrivateRoute path="/protectedRoute" component={TaskList}/> 

        </Switch>
      </MemoryRouter>
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
      <Link to="/settings"> Settings </Link>
      <br />
      <Link to="/protectedRoute">Try a Protected Route</Link>
    </div>
  )
}

export default App;
