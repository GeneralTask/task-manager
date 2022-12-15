import { useCallback, useEffect, useRef, useState } from 'react'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { DETAILS_SYNC_TIMEOUT, NO_TITLE, SYNC_MESSAGES } from '../../constants'
import { TModifyNoteData, useModifyNote } from '../../services/api/notes.hooks'
import { Spacing } from '../../styles'
import { icons } from '../../styles/images'
import { TNote } from '../../utils/types'
import Flex from '../atoms/Flex'
import GTTextField from '../atoms/GTTextField'
import { Icon } from '../atoms/Icon'
import { Label } from '../atoms/typography/Typography'
import DetailsViewTemplate from '../templates/DetailsViewTemplate'
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
    display: block;
`
interface NoteDetailsProps {
    note: TNote
    link: string
}
const NoteDetails = ({ note }: NoteDetailsProps) => {
    const [isEditing, setIsEditing] = useState(false)
    const [syncIndicatorText, setSyncIndicatorText] = useState(SYNC_MESSAGES.COMPLETE)

    const { mutate: modifyNote, isError, isLoading } = useModifyNote()
    const timers = useRef<{ [key: string]: { timeout: NodeJS.Timeout; callback: () => void } }>({})

    useEffect(() => {
        if (isEditing || isLoading) {
            setSyncIndicatorText(SYNC_MESSAGES.SYNCING)
        } else if (isError) {
            setSyncIndicatorText(SYNC_MESSAGES.ERROR)
        } else {
            setSyncIndicatorText(SYNC_MESSAGES.COMPLETE)
        }
    }, [isError, isLoading, isEditing])

    useEffect(() => {
        return () => {
            for (const timer of Object.values(timers.current)) {
                timer.callback()
                clearTimeout(timer.timeout)
            }
        }
    }, [])

    const syncNote = useCallback(
        ({ id, title, body }: TModifyNoteData) => {
            setIsEditing(false)
            const timerId = id + (title === undefined ? 'body' : 'title')
            if (title === '') title = NO_TITLE
            if (timers.current[timerId]) clearTimeout(timers.current[timerId].timeout)
            modifyNote({ id, title, body })
        },
        [note.id]
    )

    const onEdit = ({ id, title, body }: TModifyNoteData) => {
        setIsEditing(true)
        const timerId = id + (title === undefined ? 'body' : 'title')
        if (timers.current[timerId]) clearTimeout(timers.current[timerId].timeout)
        timers.current[timerId] = {
            timeout: setTimeout(() => syncNote({ id, title, body }), DETAILS_SYNC_TIMEOUT),
            callback: () => syncNote({ id, title, body }),
        }
    }

    const isShared = +DateTime.fromISO(note.shared_until ?? '0') > +DateTime.local()
    const sharedUntil = DateTime.fromISO(note.shared_until ?? '0').toLocaleString({
        month: 'long',
        day: 'numeric',
    })
    return (
        <DetailsViewTemplate>
            <DetailsTopContainer>
                <DetailItem>
                    <Icon icon={icons.note} />
                </DetailItem>
                <DetailItem>
                    <Label color="light">{syncIndicatorText}</Label>
                </DetailItem>
                <MarginLeftAuto>
                    <Flex gap={Spacing._8}>
                        <Icon icon={isShared ? icons.link : icons.link_slashed} color={isShared ? 'green' : 'gray'} />
                        <Label color={isShared ? 'green' : 'light'}>{`${
                            isShared ? `Shared until ${sharedUntil}` : 'Not shared'
                        }`}</Label>
                    </Flex>
                    <NoteSharingDropdown note={note} />
                </MarginLeftAuto>
            </DetailsTopContainer>
            <div>
                <GTTextField
                    type="plaintext"
                    itemId={note.id}
                    value={note.title}
                    onChange={(val) => onEdit({ id: note.id, title: val })}
                    maxHeight={TITLE_MAX_HEIGHT}
                    fontSize="medium"
                    blurOnEnter
                />
            </div>
            <GTTextField
                type="markdown"
                itemId={note.id}
                value={note.body}
                placeholder="Add details"
                onChange={(val) => onEdit({ id: note.id, body: val })}
                minHeight={BODY_MIN_HEIGHT}
                fontSize="small"
            />
            <Label color="light">{`Last updated ${DateTime.fromISO(note.updated_at).toLocaleString({
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
            })}`}</Label>
        </DetailsViewTemplate>
    )
}

export default NoteDetails
