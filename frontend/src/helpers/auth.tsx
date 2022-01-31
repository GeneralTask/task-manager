import { GoogleLogin, GoogleLoginResponse, GoogleLoginResponseOffline } from 'react-google-login'
import React, { useCallback, useState } from 'react'

// import { OAuth2Client } from 'google-auth-library'
import { REACT_APP_GOOGLE_OAUTH_CLIENT_ID } from '../constants'
import { Redirect } from 'react-router-dom'
import { setAccessToken } from '../redux/userDataSlice'
import { useAppDispatch } from '../redux/hooks'

export default function GoogleLoginButton() {
    const [redirect, setRedirect] = useState(false)
    const dispatch = useAppDispatch()
    const onSuccess = useCallback((response: GoogleLoginResponse | GoogleLoginResponseOffline) => {
        try {
            const loginResponse = response as GoogleLoginResponse
            dispatch(setAccessToken(loginResponse.accessToken))
        }
        catch (e) {
            console.log({ e })
        }
        finally {

        }
    }, [dispatch])
    if (REACT_APP_GOOGLE_OAUTH_CLIENT_ID == null || redirect) {
        return <Redirect to="/" />
    }
    return <GoogleLogin
        clientId={REACT_APP_GOOGLE_OAUTH_CLIENT_ID}
        buttonText="Google (with client-side encryption)"
        onSuccess={onSuccess}
        cookiePolicy="single_host_origin"
        redirectUri="http/localhost:3000"
        scope="https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar.events"
    />
}
