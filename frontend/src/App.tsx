import './App.css'
import 'react-toastify/dist/ReactToastify.css'

import Cookies from 'js-cookie'
import { Outlet } from 'react-router-dom'
import React from 'react'
import { setAuthToken } from './redux/userDataSlice'
import { useAppDispatch } from './redux/hooks'

const App: React.FC = () => {
    useAppDispatch()(setAuthToken(Cookies.get('authToken') ?? null))
    return <Outlet />
}

export default App
