import { resetServerContext } from "react-beautiful-dnd";
import './App.css';
import { BrowserRouter, Route, Switch, Redirect, Link } from "react-router-dom";
import Cookies from 'js-cookie'
import { Provider } from 'react-redux';
import store from './redux/store';
import { TASKS_URL } from './constants'

import TaskList from "./components/task/TaskList";
import GLButton from "./components/login/GoogleLogin";

resetServerContext()

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Switch>

          {/* landing page route */}
          <Route exact path="/" component={Home}/>

          {/* task page route, should be changed to PrivateRoute once login is functional */}
          <Route path="/tasks" component={TaskList}/> 

          {/* Demo to show PrivateRoute protection */}
          <PrivateRoute path="/protectedRoute" component={TaskList}/> 

          {/* External login button redirect for Google OAuth */}
          <Route path="/login" component={() => {
            window.location.href = TASKS_URL;
            return null;
          }}/>
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
      <Link to="/login"><GLButton/></Link>
    </div>
  )
}

export default App;
