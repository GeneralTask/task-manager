import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { useGetNote } from '../../services/api/notes.hooks'
import { Colors, Spacing } from '../../styles'
import { noteBackground } from '../../styles/images'
import { emptyFunction } from '../../utils/utils'
import GTTextField from '../atoms/GTTextField'
import Spinner from '../atoms/Spinner'
import GoogleSignInButton from '../atoms/buttons/GoogleSignInButton'
import NoStyleButton from '../atoms/buttons/NoStyleButton'
import { Header, Subtitle } from '../atoms/typography/Typography'
import { GTBetaLogo } from '../views/NavigationView'

const MainContainer = styled.div`
    width: 100vw;
    height: 100vh;
    background: url(${noteBackground}) no-repeat center/100% fixed;
    display: flex;
    flex-direction: column;
    align-items: center;
`
const Body = styled.div`
    width: 700px;
    height: 100vh;
    background: ${Colors.background.white};
    display: flex;
    flex-direction: column;
    padding: ${Spacing._64};
    gap: ${Spacing._32};
    overflow-y: auto;
`
const SignInButton = styled.div`
    position: absolute;
    top: ${Spacing._16};
    right: ${Spacing._16};
    width: 200px;
`
const GTLogo = styled.div`
    position: absolute;
    top: ${Spacing._24};
    left: ${Spacing._16};
`

const NoteView = () => {
    const navigate = useNavigate()
    const { note: noteId } = useParams()
    if (!noteId) navigate('/')

    const { data: note, isLoading } = useGetNote({ id: noteId ?? '' })
    if (!isLoading && !note) navigate('/')
    if (!note) return <Spinner />

    const { title, author, body } = note

    return (
        <MainContainer>
            <GTLogo>
                <NoStyleButton onClick={() => navigate('/')}>
                    <GTBetaLogo src="/images/GT-beta-logo.png" />
                </NoStyleButton>
            </GTLogo>
            <SignInButton>
                <GoogleSignInButton />
            </SignInButton>
            <Body>
                <Header>{title}</Header>
                <Subtitle>{`From ${author}`}</Subtitle>
                <GTTextField type="markdown" value={body} onChange={emptyFunction} fontSize="small" disabled readOnly />
            </Body>
        </MainContainer>
    )
}

export default NoteView
