import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
import reportWebVitals from './reportWebVitals'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Provider } from 'react-redux'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer, Zoom, toast } from 'react-toastify'
import LandingPage from './components/LandingPage'
import { TOAST_DURATION } from './constants'
import store from './redux/store'
import Settings from './components/settings/Settings'
import PrivateOutlet from './components/PrivateOutlet'
import TasksPage from './components/task/TasksPage'
import MessagesPage from './components/messages/MessagesPage'

ReactDOM.render(
    <React.StrictMode>
        <Provider store={store}>
            <ToastContainer
                draggable={false}
                transition={Zoom}
                autoClose={TOAST_DURATION}
                position={toast.POSITION.BOTTOM_RIGHT}
            />
            <DndProvider backend={HTML5Backend}>
                <BrowserRouter>
                    <Routes>
                        <Route path="*" element={<Navigate to="/" />} />
                        <Route path="/" element={<App />}>
                            <Route index element={<LandingPage />} />
                            <Route path="tasks/:section" element={<PrivateOutlet />}>
                                <Route index element={<TasksPage />} />
                            </Route>
                            <Route path="messages" element={<PrivateOutlet />}>
                                <Route index element={<MessagesPage />} />
                            </Route>
                            <Route path="settings" element={<PrivateOutlet />}>
                                <Route index element={<Settings />} />
                            </Route>
                        </Route>
                    </Routes>
                </BrowserRouter>
            </DndProvider>
        </Provider>
    </React.StrictMode>,
    document.getElementById('root')
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
