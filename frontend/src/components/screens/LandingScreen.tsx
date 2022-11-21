import { Navigate } from 'react-router-dom'
import Cookies from 'js-cookie'
import { AUTHORIZATION_COOKE } from '../../constants'
import getEnvVars, { isDevelopmentMode } from '../../environment'
import GoogleSignInButton from '../atoms/buttons/GoogleSignInButton'

const LandingScreen = () => {
    if (Cookies.get(AUTHORIZATION_COOKE)) return <Navigate to="/overview" replace />
    else if (isDevelopmentMode)
        return (
            <div>
                <GoogleSignInButton />
            </div>
        )
    else {
        window.location.href = getEnvVars().REACT_APP_TRY_BASE_URL
        return null
    }
}

export default LandingScreen
