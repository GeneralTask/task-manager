import './App.css'
import 'react-toastify/dist/ReactToastify.css'

import { BrowserRouter, Route, Switch } from 'react-router-dom'
import { LANDING_PATH, PRIVACY_PATH, SETTINGS_PATH, TOAST_DURATION } from './constants'
import { ToastContainer, Zoom, toast } from 'react-toastify'

import Header from './components/Header'
import LandingPage from './components/LandingPage'
import PrivacyPolicy from './components/PrivacyPolicy'
import { Provider } from 'react-redux'
import React from 'react'
import Settings from './components/settings/Settings'
import { getAuthToken } from './helpers/utils'
import store from './redux/store'

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ToastContainer draggable={false} transition={Zoom} autoClose={TOAST_DURATION} position={toast.POSITION.BOTTOM_RIGHT} />
      <BrowserRouter>
        <Header isLoggedIn={Boolean(getAuthToken())} />
        <Switch>
          {/* Settings page, only accessible if logged in */}
          {getAuthToken() ? <Route path={SETTINGS_PATH} component={Settings} /> : null}

          <Route path={PRIVACY_PATH} component={PrivacyPolicy} />

          {/* MAKE SURE THIS IS THE LAST ROUTE */}
          {/* base url, shows landing page if not logged in, shows tasks page if logged in */}
          <Route path={LANDING_PATH} component={LandingPage} />
        </Switch>
      </BrowserRouter>
    </Provider>
  )
}

export default App
