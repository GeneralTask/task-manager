import Cookies from 'js-cookie'
import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { AUTHORIZATION_COOKE } from '../constants'
import { useAppSelector } from '../redux/hooks'


function PrivateOutlet(): JSX.Element {
    const { authToken } = useAppSelector(state => ({ authToken: state.user_data.auth_token }))
    const authCookie = Cookies.get(AUTHORIZATION_COOKE)

    return authCookie || authToken ? <Outlet /> : <Navigate to="/" />
}

export default PrivateOutlet
