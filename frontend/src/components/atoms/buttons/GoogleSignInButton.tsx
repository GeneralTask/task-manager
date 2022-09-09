import { Images } from '../../../styles'
import { LOGIN_URL } from '../../../constants'

import styled from 'styled-components'

export const signInWithGoogleButtonDimensions = {
    width: '191px',
    height: '92px',
}
const GoogleButtonContainer = styled.div`
    width: 100%;
    max-height: ${signInWithGoogleButtonDimensions};
    display: flex;
    justify-content: center;
`
const GoogleSignInImage = styled.img`
    width: ${signInWithGoogleButtonDimensions.width};
`

export const GoogleSignInButtonImage = <GoogleSignInImage src={Images.buttons.google_sign_in} />

const GoogleSignInButton = () => {
    return (
        <GoogleButtonContainer>
            <a href={LOGIN_URL}>{GoogleSignInButtonImage}</a>
        </GoogleButtonContainer>
    )
}

export default GoogleSignInButton
