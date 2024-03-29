import { DateTime } from 'luxon'
import styled from 'styled-components'
import { NOTE_SYNC_TIMEOUT, SHARED_ITEM_INDEFINITE_DATE } from '../../constants'
import { useDebouncedEdit } from '../../hooks'
import { useModifyNote } from '../../services/api/notes.hooks'
import { Spacing } from '../../styles'
import { icons, logos } from '../../styles/images'
import { TNote } from '../../utils/types'
import { getFormattedEventTime } from '../../utils/utils'
import Flex from '../atoms/Flex'
import GTTextField from '../atoms/GTTextField'
import { Icon } from '../atoms/Icon'
import { BodySmall, LabelSmall } from '../atoms/typography/Typography'
import DetailsViewTemplate from '../templates/DetailsViewTemplate'
import NoteActionsDropdown from './NoteActionsDropdown'
import NoteSharingDropdown from './NoteSharingDropdown'

const TITLE_MAX_HEIGHT = 208
const NOTE_TITLE_MAX_WIDTH = 125
const BODY_MIN_HEIGHT = 200

const DetailsTopContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-basis: 50px;
    flex-shrink: 0;
`
const MarginLeftAuto = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-left: auto;
    gap: ${Spacing._8};
`
const DetailItem = styled.div`
    display: flex;
    align-items: center;
    margin-left: ${Spacing._8};
    max-width: ${NOTE_TITLE_MAX_WIDTH}px;
`
const MeetingInfoContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: ${Spacing._8};
    margin-bottom: ${Spacing._8};
    padding: 0 ${Spacing._12};
`
interface NoteDetailsProps {
    note: TNote
    link: string
}
const NoteDetails = ({ note }: NoteDetailsProps) => {
    const { mutate: onSave, isError, isLoading } = useModifyNote()
    const { onEdit, syncIndicatorText } = useDebouncedEdit({ onSave, isError, isLoading }, NOTE_SYNC_TIMEOUT)

    const sharedUntil =
        note.shared_until === SHARED_ITEM_INDEFINITE_DATE
            ? 'Shared indefinitely'
            : `Shared until ${DateTime.fromISO(note.shared_until ?? '0').toLocaleString({
                  month: 'long',
                  day: 'numeric',
              })}`
    const isShared = +DateTime.fromISO(note.shared_until ?? '0') > +DateTime.local()
    const isMeetingNote = note.linked_event_id != null

    return (
        <DetailsViewTemplate>
            <DetailsTopContainer>
                <DetailItem>
                    <Icon icon={isMeetingNote ? logos.gcal : icons.note} />
                </DetailItem>
                <DetailItem>
                    <BodySmall color="light">{syncIndicatorText}</BodySmall>
                </DetailItem>
                <MarginLeftAuto>
                    {isShared && (
                        <Flex gap={Spacing._8}>
                            <Icon icon={icons.link} color="green" />
                            <BodySmall color="green">{sharedUntil}</BodySmall>
                        </Flex>
                    )}
                    <NoteSharingDropdown note={note} />
                    <NoteActionsDropdown note={note} />
                </MarginLeftAuto>
            </DetailsTopContainer>
            <div>
                <GTTextField
                    key={note.id}
                    type="plaintext"
                    value={note.title}
                    onChange={(val) => onEdit({ id: note.id, title: val })}
                    maxHeight={TITLE_MAX_HEIGHT}
                    fontSize="medium"
                    enterBehavior="blur"
                    disabled={isMeetingNote}
                />
            </div>
            {isMeetingNote && note.linked_event_start && note.linked_event_end && (
                <MeetingInfoContainer>
                    <Icon color="gray" icon={icons.calendar_blank} />
                    <LabelSmall color="light">
                        {getFormattedEventTime(
                            DateTime.fromISO(note.linked_event_start),
                            DateTime.fromISO(note.linked_event_end),
                            'long'
                        )}
                    </LabelSmall>
                </MeetingInfoContainer>
            )}
            <GTTextField
                key={note.id}
                type="markdown"
                value={note.body}
                placeholder="Add details"
                onChange={(val) => onEdit({ id: note.id, body: val })}
                minHeight={BODY_MIN_HEIGHT}
                fontSize="small"
            />
        </DetailsViewTemplate>
    )
}

export default NoteDetails
