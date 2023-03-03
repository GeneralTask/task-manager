import { DateTime } from 'luxon'
import styled from 'styled-components'
import { NOTE_SYNC_TIMEOUT } from '../../constants'
import { useDebouncedEdit } from '../../hooks'
import { useModifyNote } from '../../services/api/notes.hooks'
import { Spacing } from '../../styles'
import { icons } from '../../styles/images'
import { TNote } from '../../utils/types'
import Flex from '../atoms/Flex'
import GTTextField from '../atoms/GTTextField'
import { Icon } from '../atoms/Icon'
import { DeprecatedLabel } from '../atoms/typography/Typography'
import DetailsViewTemplate from '../templates/DetailsViewTemplate'
import NoteActionsDropdown from './NoteActionsDropdown'
import NoteSharingDropdown from './NoteSharingDropdown'

const TITLE_MAX_HEIGHT = 208
const NOTE_TITLE_MAX_WIDTH = 125
const BODY_MIN_HEIGHT = 200

export const SHARED_NOTE_INDEFINITE_DATE = '9999-10-31T00:00:00Z'

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
interface NoteDetailsProps {
    note: TNote
    link: string
}
const NoteDetails = ({ note }: NoteDetailsProps) => {
    const { mutate: onSave, isError, isLoading } = useModifyNote()
    const { onEdit, syncIndicatorText } = useDebouncedEdit({ onSave, isError, isLoading }, NOTE_SYNC_TIMEOUT)

    const sharedUntil =
        note.shared_until === SHARED_NOTE_INDEFINITE_DATE
            ? 'Shared indefinitely'
            : `Shared until ${DateTime.fromISO(note.shared_until ?? '0').toLocaleString({
                  month: 'long',
                  day: 'numeric',
              })}`
    const isShared = +DateTime.fromISO(note.shared_until ?? '0') > +DateTime.local()

    return (
        <DetailsViewTemplate>
            <DetailsTopContainer>
                <DetailItem>
                    <Icon icon={icons.note} />
                </DetailItem>
                <DetailItem>
                    <DeprecatedLabel color="light">{syncIndicatorText}</DeprecatedLabel>
                </DetailItem>
                <MarginLeftAuto>
                    {isShared && (
                        <Flex gap={Spacing._8}>
                            <Icon icon={icons.link} color="green" />
                            <DeprecatedLabel color="green">{sharedUntil}</DeprecatedLabel>
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
                />
            </div>
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
