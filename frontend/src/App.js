import { resetServerContext } from "react-beautiful-dnd";
import './App.css';
import { BrowserRouter, Route, Switch, Redirect, Link } from "react-router-dom";
import Cookies from 'js-cookie'
import { Provider } from 'react-redux';
import store from './redux/store';
import { TASKS_PATH, SETTINGS_PATH } from './constants'

import TaskList from "./components/task/TaskList"
import Header from "./components/Header"
import Settings from "./components/settings/Settings"

resetServerContext()

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
      <Header/>
        <Switch>
          {/* Settings page, only accessible if logged in */}
          <PrivateRoute path={SETTINGS_PATH} component={Settings}/> 

          {/* base url, shows landing page if not logged in, shows tasks page if logged in */}
          <Route path={TASKS_PATH} component={LandingPage}/>

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

function LandingPage() {
  if (Cookies.get('authToken')) {
    return <TaskList />
  }
  return (
    <div id="home">
      <h1>General Task</h1>
      <h2>Welcome to the landing page!</h2>
      <Link to={TASKS_PATH}> See Tasks </Link>
      <br />
      <Link to={SETTINGS_PATH}> Settings </Link>
    </div>
  )
}

export default App;
