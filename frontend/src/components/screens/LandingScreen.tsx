import { useEffect } from 'react'
import getEnvVars from '../../environment'
import GoogleSignInButton from '../atoms/buttons/GoogleSignInButton'

const LandingScreen = () => {
    const isDevelopment = getEnvVars()
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
