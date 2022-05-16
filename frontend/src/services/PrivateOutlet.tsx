import Cookies from 'js-cookie'
import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { AUTHORIZATION_COOKE } from '../constants'

function PrivateOutlet(): JSX.Element {
    if (Cookies.get(AUTHORIZATION_COOKE)) {
        return <Outlet />
    }
    return <Navigate to="/" />
}

export default PrivateOutlet
