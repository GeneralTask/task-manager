import { Navigate } from 'react-router-dom'
import Cookies from 'js-cookie'
import { AUTHORIZATION_COOKE } from '../../constants'
import getEnvVars, { isDevelopmentMode } from '../../environment'
import GoogleSignInButton from '../atoms/buttons/GoogleSignInButton'

const LandingScreen = () => {
    if (Cookies.get(AUTHORIZATION_COOKE)) return <Navigate to="/overview" replace />
    else if (!isDevelopmentMode) return <Navigate to={getEnvVars().REACT_APP_TRY_BASE_URL} replace />
    else
        return (
            <div>
                <GoogleSignInButton />
            </div>
        )
}

export default LandingScreen
