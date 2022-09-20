import styled from 'styled-components'
import { LOGIN_URL } from '../../../constants'
import { Images } from '../../../styles'

const Anchor = styled.a`
    max-width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
`
const GoogleSignInImage = styled.img`
    width: 100%;
`

export const GoogleSignInButtonImage = <GoogleSignInImage src={Images.buttons.google_sign_in} />

const GoogleSignInButton = () => {
    return <Anchor href={LOGIN_URL}>{GoogleSignInButtonImage}</Anchor>
}

export default GoogleSignInButton
