import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import Cookies from 'js-cookie'
import { AUTHORIZATION_COOKE } from '../../constants'
import getEnvVars from '../../environment'
import GoogleSignInButton from '../atoms/buttons/GoogleSignInButton'

const LandingScreen = () => {
    const isDevelopment = getEnvVars()

    if (Cookies.get(AUTHORIZATION_COOKE)) return <Navigate to="/overview" />

    useEffect(() => {
        if (!isDevelopment) {
            window.location.href = getEnvVars().REACT_APP_TRY_BASE_URL
        }
    }, [])

    if (!isDevelopment) return <></>
    return (
        <div>
            <GoogleSignInButton />
        </div>
    )
}

export default LandingScreen
