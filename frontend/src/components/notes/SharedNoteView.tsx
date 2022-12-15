import { useNavigate, useParams } from 'react-router-dom'
import Cookies from 'js-cookie'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { AUTHORIZATION_COOKE, LOGIN_URL } from '../../constants'
import { useGetNote, useGetNotes } from '../../services/api/notes.hooks'
import { Border, Colors, Shadows, Spacing } from '../../styles'
import { buttons, icons, noteBackground } from '../../styles/images'
import { openPopupWindow } from '../../utils/auth'
import { emptyFunction, getFormattedDuration, getHumanTimeSinceDateTime } from '../../utils/utils'
import Flex from '../atoms/Flex'
import GTTextField from '../atoms/GTTextField'
import { Icon } from '../atoms/Icon'
import { Divider } from '../atoms/SectionDivider'
import Spinner from '../atoms/Spinner'
import GTButton from '../atoms/buttons/GTButton'
import NoStyleButton from '../atoms/buttons/NoStyleButton'
import { Body, Label, Title } from '../atoms/typography/Typography'

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
    gap: ${Spacing._24};
    margin: ${Spacing._24};
`
const SignInButton = styled(NoStyleButton)`
    width: 200px;
`
const GoogleImage = styled.img`
    width: 100%;
`

const SharedNoteView = () => {
    const navigate = useNavigate()
    const { noteId } = useParams()
    if (!noteId) navigate('/')
    const isLoggedIn = !!Cookies.get(AUTHORIZATION_COOKE)

    const { data: note, isLoading } = useGetNote({ id: noteId ?? '' })

    const { data: notes, isLoading: isLoadingNotes } = useGetNotes(isLoggedIn)

    if (isLoading || isLoadingNotes) return <Spinner />
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
                        <SignInButton onClick={() => openPopupWindow(LOGIN_URL, emptyFunction, false, true)}>
                            <GoogleImage src={buttons.google_sign_in} />
                        </SignInButton>
                    )}
                </TopContainer>
                <BottomContainer>
                    <NoteBody>
                        {note && note.shared_until ? (
                            <>
                                <GTTextField
                                    type="plaintext"
                                    itemId={note.title}
                                    value={note.title}
                                    onChange={emptyFunction}
                                    fontSize="large"
                                    disabled
                                    readOnly
                                />
                                <GTTextField
                                    type="markdown"
                                    itemId={note.body}
                                    value={note.body}
                                    onChange={emptyFunction}
                                    fontSize="small"
                                    disabled
                                    readOnly
                                />
                                <Divider color={Colors.border.light} />
                                <Flex justifyContent="space-between" alignItems="center">
                                    <Flex gap={Spacing._4}>
                                        {isLoggedIn && notes?.findIndex((n) => n.id === note.id) !== -1 ? (
                                            <>
                                                <Label color="light">{`You shared this note ${getHumanTimeSinceDateTime(
                                                    DateTime.fromISO(note.updated_at)
                                                )}`}</Label>
                                                <Label>
                                                    <NoStyleButton onClick={() => navigate(`/notes/${noteId}`)}>
                                                        (edit note)
                                                    </NoStyleButton>
                                                </Label>
                                            </>
                                        ) : (
                                            <Label color="light">{`${
                                                note.author
                                            } shared this note with you ${getHumanTimeSinceDateTime(
                                                DateTime.fromISO(note.updated_at)
                                            )}`}</Label>
                                        )}
                                    </Flex>
                                    <Flex gap={Spacing._4}>
                                        <Icon color="gray" icon={icons.link} />
                                        <Label color="light">{`Link expires in ${getFormattedDuration(
                                            DateTime.fromISO(note.shared_until).diffNow('milliseconds', {
                                                conversionAccuracy: 'longterm',
                                            }),
                                            2
                                        )}`}</Label>
                                    </Flex>
                                </Flex>
                            </>
                        ) : (
                            <>
                                <Title>This note is no longer available.</Title>
                                <Body>
                                    This shared note has expired or is unavailable. Please reach out to the person who
                                    sent this shared note for a new link.
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
