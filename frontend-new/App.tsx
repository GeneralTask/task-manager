import React from 'react'
import LandingScreen from './src/screens/LandingScreen'
import { Provider } from 'react-redux'
import store from './src/redux/store'
import TasksScreen from './src/screens/TasksScreen'
import { Route, Router, Routes, Outlet, Navigate } from './src/services/routing'
import PrivateOutlet from './src/services/PrivateOutlet'

const App = () => {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="*" element={<Navigate to="/" />} />
          <Route path="/" element={<Outlet />} >
            <Route index element={<LandingScreen />} />
            <Route path="tasks" element={<PrivateOutlet />}>
              <Route index element={<TasksScreen />} />
              <Route path=":section" element={<TasksScreen />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </Provider >
  )
}

export default App
