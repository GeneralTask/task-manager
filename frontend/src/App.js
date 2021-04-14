import './App.css';
import { BrowserRouter, Route, Switch, Redirect } from "react-router-dom";
import Cookies from 'js-cookie'
import { Provider } from 'react-redux';
import store from './redux/store';
import { LANDING_PATH, SETTINGS_PATH, LOGIN_URL } from './constants'

import Header from "./components/Header"
import Settings from "./components/settings/Settings"
import LandingPage from "./components/LandingPage"

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
      { Cookies.get('authToken') ? <Header/> : null }
        <Switch>
          {/* Settings page, only accessible if logged in */}
          <PrivateRoute path={SETTINGS_PATH} component={Settings}/> 

          {/* External login button redirect for Google OAuth */}
          <Route path="/login" component={() => {
            window.location.href = LOGIN_URL;
            return null;
          }}/>

          {/* MAKE SURE THIS IS THE LAST ROUTE */}
          {/* base url, shows landing page if not logged in, shows tasks page if logged in */}
          <Route path={LANDING_PATH} component={LandingPage}/>
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

export default App;
