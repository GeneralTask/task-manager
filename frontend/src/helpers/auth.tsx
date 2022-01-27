import { GoogleLogin, GoogleLoginResponse, GoogleLoginResponseOffline } from 'react-google-login'

// import { OAuth2Client } from 'google-auth-library'
import { REACT_APP_GOOGLE_OAUTH_CLIENT_ID } from '../constants'
import React from 'react'

const onSuccess = (response: GoogleLoginResponse | GoogleLoginResponseOffline) => {
    try {
        const loginResponse = response as GoogleLoginResponse

        console.log(loginResponse.tokenId)
        const authResponse = loginResponse.getAuthResponse()
        console.log({ authResponse })
        // dispatchEvent(setAuthToken(loginResponse.accessToken))
    }
    catch (e) {
        console.log({ e })
    }
}

export default function GoogleLoginButton() {
    if (REACT_APP_GOOGLE_OAUTH_CLIENT_ID == null) {
        return <></>
    }
    return <GoogleLogin
        clientId={REACT_APP_GOOGLE_OAUTH_CLIENT_ID}
        buttonText="Sign in with Google"
        onSuccess={onSuccess}
        // onFailure={response => console.log({ response })}
        cookiePolicy="single_host_origin"
        redirectUri="http/localhost:3000"
        // redirectUri="http://localhost:8080/link/google/callback/"
        scope="https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar.events"
    />
}

