import React from 'react'
import { LOGIN_URL } from '../../../constants'
import styled from 'styled-components'
import NoStyleButton from './NoStyleButton'


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
    const onClick = () => window.location.href = LOGIN_URL
    return (
        <GoogleButtonContainer>
            <NoStyleButton onClick={onClick}>
                <GoogleSignInImage src={require('../../../assets/google_sign_in.png')} />
            </NoStyleButton>
        </GoogleButtonContainer>
    )
}

export default GoogleSignInButton
