import React from 'react'
import LandingScreen from './src/screens/LandingScreen'
import { Provider } from 'react-redux'
import store from './src/redux/store'
import TasksScreen from './src/screens/TasksScreen'
import { Route, Router, Routes, Outlet, Navigate } from './src/services/routing'
import PrivateOutlet from './src/services/PrivateOutlet'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { TouchBackend } from 'react-dnd-touch-backend'
import { Platform } from 'react-native'

const App = () => {
  const backend = Platform.OS === 'web' ? HTML5Backend : TouchBackend
  return (
    <Provider store={store}>
      <DndProvider backend={backend}>
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
      </DndProvider>
    </Provider >
  )
}

export default App
