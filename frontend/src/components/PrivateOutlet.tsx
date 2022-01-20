import React from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { getAuthToken } from '../helpers/utils'

function PrivateOutlet(): JSX.Element {
    const authToken = getAuthToken()
    return authToken ? <Outlet /> : <Navigate to="/" />
}

export default PrivateOutlet
