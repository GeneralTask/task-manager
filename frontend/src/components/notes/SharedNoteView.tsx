import { Helmet } from 'react-helmet'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Cookies from 'js-cookie'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { AUTHORIZATION_COOKE } from '../../constants'
import { useGetNote, useGetNotes } from '../../services/api/notes.hooks'
import { Spacing } from '../../styles'
import { emptyFunction, getFormattedEventTime, getHumanTimeSinceDateTime } from '../../utils/utils'
import Flex from '../atoms/Flex'
import GTTextField from '../atoms/GTTextField'
import Spinner from '../atoms/Spinner'
import { LabelSmall, TitleLarge } from '../atoms/typography/Typography'
import { BackgroundContainer } from '../molecules/shared_item_page/BackgroundContainer'
import ContentContainer from '../molecules/shared_item_page/ContentContainer'
import NotAvailableMessage from '../molecules/shared_item_page/NotAvailableMessage'
import SharedItemBodyContainer from '../molecules/shared_item_page/SharedItemBody'
import SharedItemHeader from '../molecules/shared_item_page/SharedItemHeader'
import NoteActionsDropdown from './NoteActionsDropdown'

const FlexPadding8Horizontal = styled(Flex)`
    padding: 0 ${Spacing._8};
`

const SharedNoteView = () => {
    const navigate = useNavigate()
    const { noteId } = useParams()
    const isLoggedIn = !!Cookies.get(AUTHORIZATION_COOKE)
    const { data: note, isLoading } = useGetNote({ id: noteId ?? '' })
    const { data: notes, isLoading: isLoadingNotes } = useGetNotes(isLoggedIn)
    const isUserNoteOwner = (notes ?? []).some((userNote) => userNote.id === note?.id)

    const getSharedWithText = () => {
        if (note?.shared_access === 'domain') return 'all members of the organization'
        if (note?.shared_access === 'meeting_attendees') return 'all attendees of the meeting'
        if (note?.shared_access === 'public') return 'everyone'
    }

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
                    <SharedItemBodyContainer
                        content={
                            note && note.shared_until ? (
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
                                </>
                            ) : (
                                <NotAvailableMessage sharedType="Notes" />
                            )
                        }
                        footer={
                            note &&
                            note.shared_until && (
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
                                    <LabelSmall color="light">{`Shared with ${getSharedWithText()}`}</LabelSmall>
                                </FlexPadding8Horizontal>
                            )
                        }
                    />
                </ContentContainer>
            </BackgroundContainer>
        </>
    )
}

export default SharedNoteView
