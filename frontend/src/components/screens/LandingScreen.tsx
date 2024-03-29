import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import Cookies from 'js-cookie'
import { AUTHORIZATION_COOKE } from '../../constants'
import getEnvVars, { isDevelopmentMode } from '../../environment'
import GoogleAuthScreen from './GoogleAuthScreen'

const LandingScreen = () => {
    if (Cookies.get(AUTHORIZATION_COOKE)) return <Navigate to="/overview" replace />
    useEffect(() => {
        if (!isDevelopmentMode) {
            window.location.replace(getEnvVars().REACT_APP_TRY_BASE_URL)
        }
    }, [])

    if (!isDevelopmentMode) return <></>
    return <GoogleAuthScreen />
}

export default LandingScreen
