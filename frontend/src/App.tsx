import './App.css'
import 'react-toastify/dist/ReactToastify.css'
import React from 'react'
import { Outlet } from 'react-router-dom'
import { useAppDispatch } from './redux/hooks'
import { setAuthToken } from './redux/userDataSlice'
import Cookies from 'js-cookie'

const App: React.FC = () => {
    useAppDispatch()(setAuthToken(Cookies.get('authToken')))
    return <Outlet />
}

export default App
