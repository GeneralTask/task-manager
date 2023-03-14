import { useEffect } from 'react'
import { Helmet } from 'react-helmet'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Cookies from 'js-cookie'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { AUTHORIZATION_COOKE, SHARED_ITEM_INDEFINITE_DATE } from '../../constants'
import getEnvVars from '../../environment'
import useAnalyticsEventTracker from '../../hooks/useAnalyticsEventTracker'
import { useGetNote, useGetNotes } from '../../services/api/notes.hooks'
import { Border, Colors, Shadows, Spacing } from '../../styles'
import { emptyFunction, getFormattedDuration, getHumanTimeSinceDateTime } from '../../utils/utils'
import Flex from '../atoms/Flex'
import GTTextField from '../atoms/GTTextField'
import NoStyleAnchor from '../atoms/NoStyleAnchor'
import { Divider } from '../atoms/SectionDivider'
import Spinner from '../atoms/Spinner'
import GTButton from '../atoms/buttons/GTButton'
import { DeprecatedBody, DeprecatedLabel, DeprecatedTitle } from '../atoms/typography/Typography'
import { BackgroundContainer } from '../molecules/shared_item_page/BackgroundContainer'
import SharedItemHeader from '../molecules/shared_item_page/SharedItemHeader'
import NoteActionsDropdown from './NoteActionsDropdown'

export const HeaderContainer = styled.div`
    position: fixed;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: ${Spacing._24};
    width: 750px;
    z-index: 10;
`
const ColumnContainer = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 750px;
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
    gap: ${Spacing._24};
    margin: ${Spacing._24};
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
    const navigate = useNavigate()
    const { noteId } = useParams()
    const isLoggedIn = !!Cookies.get(AUTHORIZATION_COOKE)

    const { data: note, isLoading } = useGetNote({ id: noteId ?? '' })

    const { data: notes, isLoading: isLoadingNotes } = useGetNotes(isLoggedIn)
    const isUserNoteOwner = (notes ?? []).some((userNote) => userNote.id === note?.id)

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
            <BackgroundContainer>
                <ColumnContainer>
                    <SharedItemHeader sharedType="Notes" />
                    <BottomContainer>
                        <NoteBody>
                            {note && note.shared_until ? (
                                <>
                                    <Flex alignItems="flex-start">
                                        <GTTextField
                                            type="plaintext"
                                            value={note.title}
                                            onChange={emptyFunction}
                                            fontSize="large"
                                            disabled
                                            readOnly
                                        />
                                        <NoteActionsDropdown note={note} isOwner={isUserNoteOwner} />
                                    </Flex>
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
                                                    <DeprecatedLabel color="light">{`You shared this note ${getHumanTimeSinceDateTime(
                                                        DateTime.fromISO(note.updated_at)
                                                    )}`}</DeprecatedLabel>
                                                    <DeprecatedLabel>
                                                        {'('}
                                                        <Link to={`/notes/${noteId}`}>edit note</Link>
                                                        {')'}
                                                    </DeprecatedLabel>
                                                </>
                                            ) : (
                                                <DeprecatedLabel color="light">{`${
                                                    note.author
                                                } shared this note ${getHumanTimeSinceDateTime(
                                                    DateTime.fromISO(note.updated_at)
                                                )}`}</DeprecatedLabel>
                                            )}
                                        </Flex>
                                        <DeprecatedLabel color="light">
                                            {note.shared_until === SHARED_ITEM_INDEFINITE_DATE
                                                ? ''
                                                : `Link expires in ${getFormattedDuration(
                                                      DateTime.fromISO(note.shared_until).diffNow('milliseconds', {
                                                          conversionAccuracy: 'longterm',
                                                      }),
                                                      2
                                                  )}`}
                                        </DeprecatedLabel>
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
            </BackgroundContainer>
        </>
    )
}

export default SharedNoteView
