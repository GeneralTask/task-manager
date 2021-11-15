import React from 'react'
import styled from 'styled-components'
import { GOOGLE_LIGHT_NORMAL } from '../../constants'
import { LOGIN_URL } from '../../constants'

const GoogleLoginLink = styled.a`
    display: flex;
    height: 50px;
`
const GoogleLoginImage = styled.img`
    height: 100%;
    margin-left: auto;
    margin-right: auto;
`

const GoogleLoginButton: React.FC = () =>
    <GoogleLoginLink href={LOGIN_URL}>
        <GoogleLoginImage alt="Sign in with Google" src={process.env.PUBLIC_URL + GOOGLE_LIGHT_NORMAL}/>
    </GoogleLoginLink>

export default GoogleLoginButton
