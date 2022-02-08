import './App.css'
import 'react-toastify/dist/ReactToastify.css'
import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useAppDispatch } from './redux/hooks'
import { setAuthToken } from './redux/userDataSlice'
import Cookies from 'js-cookie'
import { setShowModal } from './redux/tasksPageSlice'

const App: React.FC = () => {
    useAppDispatch()(setAuthToken(Cookies.get('authToken')))

    // useEffect(() => {
    //     useAppDispatch()(setShowModal(true))
    // }, [])

    return <Outlet />
}

export default App
