import { useNavigate, useParams } from 'react-router-dom'
import Cookies from 'js-cookie'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { AUTHORIZATION_COOKE } from '../../constants'
import { useGetNote } from '../../services/api/notes.hooks'
import { Border, Colors, Shadows, Spacing } from '../../styles'
import { icons, noteBackground } from '../../styles/images'
import { emptyFunction, getHumanTimeSinceDateTime } from '../../utils/utils'
import Flex from '../atoms/Flex'
import GTTextField from '../atoms/GTTextField'
import { Icon } from '../atoms/Icon'
import { Divider } from '../atoms/SectionDivider'
import Spinner from '../atoms/Spinner'
import GTButton from '../atoms/buttons/GTButton'
import GoogleSignInButton from '../atoms/buttons/GoogleSignInButton'
import NoStyleButton from '../atoms/buttons/NoStyleButton'
import { Body, Label, Subtitle, Title } from '../atoms/typography/Typography'

const Logo = styled.img`
    width: 153px;
`
const MainContainer = styled.div`
    width: 100vw;
    height: 100vh;
    background: url(${noteBackground});
    background-repeat: no-repeat;
    background-position: center;
    background-size: cover;
    display: flex;
    flex-direction: column;
    align-items: center;
`
const ColumnContainer = styled.div`
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 750px;
`
const TopContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: ${Spacing._32} ${Spacing._24} ${Spacing._12};
`
const BottomContainer = styled.div`
    overflow-y: auto;
`
const NoteBody = styled.div`
    background: ${Colors.background.white};
    border-radius: ${Border.radius.small};
    box-shadow: ${Shadows.medium};
    display: flex;
    flex-direction: column;
    padding: ${Spacing._24};
    gap: ${Spacing._32};
    margin: ${Spacing._24};
`
const SignInButton = styled.div`
    width: 200px;
`

const SharedNoteView = () => {
    const navigate = useNavigate()
    const { noteId } = useParams()
    if (!noteId) navigate('/')

    const { data: note, isLoading } = useGetNote({ id: noteId ?? '' })
    if (isLoading) return <Spinner />

    const isLoggedIn = Cookies.get(AUTHORIZATION_COOKE)

    return (
        <MainContainer>
            <ColumnContainer>
                <TopContainer>
                    <NoStyleButton onClick={() => navigate('/')}>
                        <Logo src="/images/gt-logo-black-on-white.svg" />
                    </NoStyleButton>
                    {isLoggedIn ? (
                        <GTButton styleType="secondary" value="Back to General Task" onClick={() => navigate('/')} />
                    ) : (
                        <SignInButton>
                            <GoogleSignInButton />
                        </SignInButton>
                    )}
                </TopContainer>
                <BottomContainer>
                    <NoteBody>
                        {note ? (
                            <>
                                <Subtitle>{note.title}</Subtitle>
                                <GTTextField
                                    type="markdown"
                                    value={note.body}
                                    onChange={emptyFunction}
                                    fontSize="small"
                                    disabled
                                    readOnly
                                />
                                <Divider color={Colors.border.light} />
                                <Flex justifyContent="space-between" alignItems="center">
                                    <Flex gap={Spacing._4}>
                                        <Label>{note.author}</Label>
                                        <Label color="light">shared this note with you</Label>
                                        <Label>{getHumanTimeSinceDateTime(DateTime.fromISO(note.updated_at))}</Label>
                                    </Flex>
                                    <Flex gap={Spacing._4}>
                                        <Icon color="gray" icon={icons.link} />
                                        <Label color="light">{`Link expires in ${DateTime.fromISO(note.shared_until)
                                            .diffNow(['days', 'hours'])
                                            .toHuman({ maximumFractionDigits: 0 })}`}</Label>
                                    </Flex>
                                </Flex>
                            </>
                        ) : (
                            <>
                                <Title>This link has expired.</Title>
                                <Body>
                                    The link to this shared note has expired. Please reach out to the person who sent
                                    this shared note for a new link.
                                </Body>
                            </>
                        )}
                    </NoteBody>
                </BottomContainer>
            </ColumnContainer>
        </MainContainer>
    )
}

export default SharedNoteView
