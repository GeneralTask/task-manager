import { useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { LOGIN_URL } from '../../constants'
import { GoogleSignInButtonImage } from '../atoms/buttons/GoogleSignInButton'

const Container = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100vw;
    height: 100vh;
`
const Link = styled.a`
    width: 200px;
`

const GoogleAuthScreen = () => {
    const [searchParams] = useSearchParams()
    const authUrl = searchParams.get('authUrl') ?? LOGIN_URL

    return (
        <Container>
            <Link href={authUrl} target="_self">
                {GoogleSignInButtonImage}
            </Link>
        </Container>
    )
}

export default GoogleAuthScreen
