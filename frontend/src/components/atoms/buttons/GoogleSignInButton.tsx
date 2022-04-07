import { LOGIN_URL } from '../../../constants'
import React from 'react'
import styled from 'styled-components'

const googleButtonDimensions = {
    width: 191,
    height: 92,
}
const GoogleButtonContainer = styled.div`
    width: 100%;
    max-height: ${googleButtonDimensions.height};
    display: flex;
    justify-content: center;
`
const GoogleSignInImage = styled.img`
    width: ${googleButtonDimensions.width}px;
`

const GoogleSignInButton = () => {
    return (
        <GoogleButtonContainer>
            <a href={LOGIN_URL}>
                <GoogleSignInImage src="../google_sign_in.png" />
            </a>
        </GoogleButtonContainer>
    )
}

export default GoogleSignInButton
