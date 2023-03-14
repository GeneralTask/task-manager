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
import { Colors, Spacing } from '../../styles'
import { emptyFunction, getFormattedDuration, getHumanTimeSinceDateTime } from '../../utils/utils'
import Flex from '../atoms/Flex'
import GTTextField from '../atoms/GTTextField'
import NoStyleAnchor from '../atoms/NoStyleAnchor'
import { Divider } from '../atoms/SectionDivider'
import Spinner from '../atoms/Spinner'
import GTButton from '../atoms/buttons/GTButton'
import { DeprecatedBody, DeprecatedLabel, DeprecatedTitle } from '../atoms/typography/Typography'
import { BackgroundContainer } from '../molecules/shared_item_page/BackgroundContainer'
import ContentContainer from '../molecules/shared_item_page/ContentContainer'
import NotAvailableMessage from '../molecules/shared_item_page/NotAvailableMessage'
import SharedItemBody from '../molecules/shared_item_page/SharedItemBody'
import SharedItemHeader from '../molecules/shared_item_page/SharedItemHeader'
import NoteActionsDropdown from './NoteActionsDropdown'

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
                <ContentContainer>
                    <SharedItemHeader sharedType="Notes" />
                    <SharedItemBody>
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
                            <NotAvailableMessage sharedType="Notes" />
                        )}
                    </SharedItemBody>
                </ContentContainer>
            </BackgroundContainer>
        </>
    )
}

export default SharedNoteView
