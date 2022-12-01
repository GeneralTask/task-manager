import { useCallback, useRef } from 'react'
import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { DETAILS_SYNC_TIMEOUT, REACT_APP_FRONTEND_BASE_URL } from '../../constants'
import { useToast } from '../../hooks'
import { TModifyNoteData, useModifyNote } from '../../services/api/notes.hooks'
import { Spacing } from '../../styles'
import { icons } from '../../styles/images'
import { TNote } from '../../utils/types'
import GTTextField from '../atoms/GTTextField'
import { Icon } from '../atoms/Icon'
import GTButton from '../atoms/buttons/GTButton'
import { Label } from '../atoms/typography/Typography'
import DetailsViewTemplate from '../templates/DetailsViewTemplate'

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
`
const DetailItem = styled.div`
    display: flex;
    align-items: center;
    margin-left: ${Spacing._8};
    max-width: ${NOTE_TITLE_MAX_WIDTH}px;
    display: block;
`

const SYNC_MESSAGES = {
    SYNCING: 'Syncing...',
    ERROR: 'There was an error syncing with our servers',
    COMPLETE: '',
}

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

    const toast = useToast()

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
                    <GTButton
                        value="Copy Note Link"
                        onClick={() => {
                            navigator.clipboard.writeText(`${REACT_APP_FRONTEND_BASE_URL}/note/${note.id}`)
                            modifyNote({ id: note.id, is_shared: true })
                            toast.show(
                                {
                                    message: `Note URL copied to clipboard`,
                                },
                                {
                                    autoClose: 2000,
                                    pauseOnFocusLoss: false,
                                    theme: 'dark',
                                }
                            )
                        }}
                        styleType="secondary"
                        size="small"
                    />
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
                    hideUnfocusedOutline
                    blurOnEnter
                />
            </div>
            <GTTextField
                itemId={note.id}
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
