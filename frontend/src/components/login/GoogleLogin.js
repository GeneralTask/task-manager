import React from 'react'
import { GOOGLE_LIGHT_NORMAL } from '../../constants'

function GoogleLoginButton() {
    return (
        <img src={process.env.PUBLIC_URL + GOOGLE_LIGHT_NORMAL} alt="Sign in with Google}"></img>
    )
}

export default GoogleLoginButton;
