import { useEffect } from 'react'
import { Helmet } from 'react-helmet'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Cookies from 'js-cookie'
import { DateTime } from 'luxon'
import styled, { css } from 'styled-components'
import { AUTHORIZATION_COOKE, LOGIN_URL } from '../../constants'
import getEnvVars from '../../environment'
import { useAuthWindow } from '../../hooks'
import useAnalyticsEventTracker from '../../hooks/useAnalyticsEventTracker'
import { useGetNote, useGetNotes } from '../../services/api/notes.hooks'
import { Border, Colors, Shadows, Spacing } from '../../styles'
import { buttons, noteBackground } from '../../styles/images'
import { emptyFunction, getFormattedEventTime, getHumanTimeSinceDateTime } from '../../utils/utils'
import Flex from '../atoms/Flex'
import GTTextField from '../atoms/GTTextField'
import NoStyleAnchor from '../atoms/NoStyleAnchor'
import { Divider } from '../atoms/SectionDivider'
import Spinner from '../atoms/Spinner'
import GTButton from '../atoms/buttons/GTButton'
import NoStyleButton from '../atoms/buttons/NoStyleButton'
import { DeprecatedBody, DeprecatedTitle, LabelSmall, TitleLarge } from '../atoms/typography/Typography'
import NoteActionsDropdown from './NoteActionsDropdown'

const background = css`
    background: url(${noteBackground});
    background-attachment: fixed;
    background-repeat: no-repeat;
    background-position: top left, 0px 0px;
    background-size: cover;
`

const Logo = styled.img`
    width: 153px;
`
const MainContainer = styled.div`
    ${background};
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow-y: auto;
`
const ColumnContainer = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 750px;
`
const TopContainer = styled.div`
    ${background};
    position: fixed;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: ${Spacing._24};
    width: 750px;
    z-index: 10;
`
const BottomContainer = styled.div`
    margin-top: 110px;
`
const NoteBody = styled.div`
    background: ${Colors.background.white};
    border-radius: ${Border.radius.medium};
    box-shadow: ${Shadows.deprecated_medium};
    display: flex;
    flex-direction: column;
    padding: ${Spacing._24};
    gap: ${Spacing._16};
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
    const GALog = useAnalyticsEventTracker('Notes')
    useEffect(() => {
        GALog('Page view', 'Shared Note View')
    }, [])
    const { openAuthWindow } = useAuthWindow()
    const navigate = useNavigate()
    const { noteId } = useParams()
    const isLoggedIn = !!Cookies.get(AUTHORIZATION_COOKE)

    const { data: note, isLoading } = useGetNote({ id: noteId ?? '' })

    const { data: notes, isLoading: isLoadingNotes } = useGetNotes(isLoggedIn)
    const isUserNoteOwner = (notes ?? []).some((userNote) => userNote.id === note?.id)
    const sharedWithText =
        note?.shared_access === 'domain'
            ? 'all members of the organization'
            : note?.shared_access === 'meeting_attendees'
            ? 'all attendees of the meeting'
            : 'everyone'

    if (!noteId) navigate('/')

    if (isLoading || isLoadingNotes) return <Spinner />
    return (
        <>
            {note && (
                <Helmet>
                    <title>{note.title}</title>
                    <meta property="og:image" content="/images/shared_note_preview.png" />
                    <meta content={note.title} property="og:title" />
                    <meta content={note.body} property="og:description" />
                </Helmet>
            )}
            <MainContainer>
                <ColumnContainer>
                    <TopContainer>
                        <NoStyleButton
                            onClick={() => {
                                GALog('Button click', 'Logo')
                                navigate('/')
                            }}
                        >
                            <Logo src="/images/gt-logo-black-on-white.svg" />
                        </NoStyleButton>
                        {isLoggedIn ? (
                            <GTButton
                                styleType="secondary"
                                value="Back to General Task"
                                onClick={() => {
                                    GALog('Button click', 'Back to General Task')
                                    navigate('/')
                                }}
                            />
                        ) : (
                            <SignInButton
                                onClick={() => {
                                    GALog('Button click', 'Sign in with Google')
                                    openAuthWindow({ url: LOGIN_URL, logEvent: false, closeOnCookieSet: true })
                                }}
                            >
                                <GoogleImage src={buttons.google_sign_in} />
                            </SignInButton>
                        )}
                    </TopContainer>
                    <BottomContainer>
                        <NoteBody>
                            {note && note.shared_until ? (
                                <>
                                    <Flex alignItems="flex-start" justifyContent="space-between">
                                        <TitleLarge>{note.title}</TitleLarge>
                                        <NoteActionsDropdown note={note} isOwner={isUserNoteOwner} />
                                    </Flex>
                                    {note.linked_event_id && note.linked_event_start && note.linked_event_end && (
                                        <LabelSmall color="light">
                                            {getFormattedEventTime(
                                                DateTime.fromISO(note.linked_event_start),
                                                DateTime.fromISO(note.linked_event_end),
                                                'long'
                                            )}
                                        </LabelSmall>
                                    )}
                                    <GTTextField
                                        key={note.id}
                                        type="markdown"
                                        value={note.body}
                                        onChange={emptyFunction}
                                        fontSize="small"
                                        disabled
                                        readOnly
                                    />
                                    <Divider color={Colors.background.border} />
                                    <FlexPadding8Horizontal justifyContent="space-between" alignItems="center">
                                        <Flex gap={Spacing._4}>
                                            {isLoggedIn && isUserNoteOwner ? (
                                                <>
                                                    <LabelSmall color="base">{`You shared this note ${getHumanTimeSinceDateTime(
                                                        DateTime.fromISO(note.updated_at)
                                                    )}`}</LabelSmall>
                                                    <LabelSmall>
                                                        {'('}
                                                        <Link to={`/notes/${noteId}`}>edit note</Link>
                                                        {')'}
                                                    </LabelSmall>
                                                </>
                                            ) : (
                                                <LabelSmall color="base">{`${
                                                    note.author
                                                } shared this note ${getHumanTimeSinceDateTime(
                                                    DateTime.fromISO(note.updated_at)
                                                )}`}</LabelSmall>
                                            )}
                                        </Flex>
                                        <LabelSmall color="light">{`Shared with ${sharedWithText}`}</LabelSmall>
                                    </FlexPadding8Horizontal>
                                </>
                            ) : (
                                <>
                                    <DeprecatedTitle>This note is not available</DeprecatedTitle>
                                    <DeprecatedBody>
                                        If you need access to this note, please reach out to the person who sent it.
                                    </DeprecatedBody>
                                    <FlexMargin8Top gap={Spacing._8}>
                                        {isLoggedIn ? (
                                            <GTButton
                                                styleType="primary"
                                                value="Back to General Task"
                                                onClick={() => {
                                                    GALog('Button click', 'Back to General Task')
                                                    navigate('/')
                                                }}
                                            />
                                        ) : (
                                            <>
                                                <NoStyleAnchor href={getEnvVars().REACT_APP_TRY_SIGN_UP_URL}>
                                                    <GTButton styleType="primary" value="Sign In to General Task" />
                                                </NoStyleAnchor>
                                                <NoStyleAnchor href={getEnvVars().REACT_APP_TRY_BASE_URL}>
                                                    <GTButton
                                                        styleType="secondary"
                                                        value="Learn more about General Task"
                                                    />
                                                </NoStyleAnchor>
                                            </>
                                        )}
                                    </FlexMargin8Top>
                                </>
                            )}
                        </NoteBody>
                    </BottomContainer>
                </ColumnContainer>
            </MainContainer>
        </>
    )
}

export default SharedNoteView
