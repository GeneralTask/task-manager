import React from 'react'
import { GOOGLE_LIGHT_NORMAL } from '../../constants'

const GoogleLoginButton = () =>
    <img src={process.env.PUBLIC_URL + GOOGLE_LIGHT_NORMAL} alt="Sign in with Google}"></img>

export default GoogleLoginButton
