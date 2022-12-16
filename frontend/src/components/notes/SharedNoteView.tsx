import { Link, useNavigate, useParams } from 'react-router-dom'
import Cookies from 'js-cookie'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { AUTHORIZATION_COOKE, LOGIN_URL } from '../../constants'
import getEnvVars from '../../environment'
import { useGetNote, useGetNotes } from '../../services/api/notes.hooks'
import { Border, Colors, Shadows, Spacing } from '../../styles'
import { buttons, noteBackground } from '../../styles/images'
import { openPopupWindow } from '../../utils/auth'
import { emptyFunction, getFormattedDuration, getHumanTimeSinceDateTime } from '../../utils/utils'
import Flex from '../atoms/Flex'
import GTTextField from '../atoms/GTTextField'
import NoStyleAnchor from '../atoms/NoStyleAnchor'
import { Divider } from '../atoms/SectionDivider'
import Spinner from '../atoms/Spinner'
import GTButton from '../atoms/buttons/GTButton'
import NoStyleButton from '../atoms/buttons/NoStyleButton'
import { Body, Label, Title } from '../atoms/typography/Typography'
import NoteActionsDropdown from './NoteActionsDropdown'

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
const FlexPadding8Horizontal = styled(Flex)`
    padding: 0 ${Spacing._8};
`
const FlexMargin8Top = styled(Flex)`
    margin-top: ${Spacing._8};
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
                                <Flex alignItems="flex-start">
                                    <GTTextField
                                        type="plaintext"
                                        itemId={note.title}
                                        value={note.title}
                                        onChange={emptyFunction}
                                        fontSize="large"
                                        disabled
                                        readOnly
                                    />
                                    <NoteActionsDropdown note={note} />
                                </Flex>
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
                                <FlexPadding8Horizontal justifyContent="space-between" alignItems="center">
                                    <Flex gap={Spacing._4}>
                                        {isLoggedIn && notes?.findIndex((n) => n.id === note.id) !== -1 ? (
                                            <>
                                                <Label color="light">{`You shared this note ${getHumanTimeSinceDateTime(
                                                    DateTime.fromISO(note.updated_at)
                                                )}`}</Label>
                                                <Label>
                                                    {'('}
                                                    <Link to={`/notes/${noteId}`}>edit note</Link>
                                                    {')'}
                                                </Label>
                                            </>
                                        ) : (
                                            <Label color="light">{`${
                                                note.author
                                            } shared this note ${getHumanTimeSinceDateTime(
                                                DateTime.fromISO(note.updated_at)
                                            )}`}</Label>
                                        )}
                                    </Flex>
                                    <Label color="light">{`Link expires in ${getFormattedDuration(
                                        DateTime.fromISO(note.shared_until).diffNow('milliseconds', {
                                            conversionAccuracy: 'longterm',
                                        }),
                                        2
                                    )}`}</Label>
                                </FlexPadding8Horizontal>
                            </>
                        ) : (
                            <>
                                <Title>This note is not available</Title>
                                <Body>
                                    If you need access to this note, please reach out to the person who sent it.
                                </Body>
                                <FlexMargin8Top gap={Spacing._8}>
                                    <NoStyleAnchor href={getEnvVars().REACT_APP_TRY_SIGN_UP_URL}>
                                        <GTButton styleType="primary" value="Sign In to General Task" />
                                    </NoStyleAnchor>
                                    <NoStyleAnchor href={getEnvVars().REACT_APP_TRY_BASE_URL}>
                                        <GTButton styleType="secondary" value="Learn more about General Task" />
                                    </NoStyleAnchor>
                                </FlexMargin8Top>
                            </>
                        )}
                    </NoteBody>
                </BottomContainer>
            </ColumnContainer>
        </MainContainer>
    )
}

export default SharedNoteView
