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

interface GoogleSignInButtonProps {
    hasLink?: boolean
}
const GoogleSignInButton = ({ hasLink = true }: GoogleSignInButtonProps) => {
    if (!hasLink) return <Anchor as="div">{GoogleSignInButtonImage}</Anchor>
    return (
        <Anchor href={LOGIN_URL} target="_self">
            {GoogleSignInButtonImage}
        </Anchor>
    )
}

export default GoogleSignInButton
