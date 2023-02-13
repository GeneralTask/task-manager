import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DateTime } from 'luxon'
import { v4 as uuidv4 } from 'uuid'
import { NOTE_SYNC_TIMEOUT, NO_TITLE, SYNC_MESSAGES } from '../../constants'
import KEYBOARD_SHORTCUTS from '../../constants/shortcuts'
import { useToast } from '../../hooks'
import { useCreateNote, useGetNotes, useModifyNote } from '../../services/api/notes.hooks'
import { useGetUserInfo } from '../../services/api/user-info.hooks'
import { Spacing } from '../../styles'
import { icons } from '../../styles/images'
import { getKeyCode, stopKeydownPropogation } from '../../utils/utils'
import Flex from '../atoms/Flex'
import GTTextField from '../atoms/GTTextField'
import GTButton from '../atoms/buttons/GTButton'
import { Label } from '../atoms/typography/Typography'
import GTModal from '../mantine/GTModal'
import { getNoteURL } from './utils'

interface NoteCreateModalProps {
    isOpen: boolean
    setIsOpen: (isOpen: boolean) => void
}
const NoteCreateModal = ({ isOpen, setIsOpen }: NoteCreateModalProps) => {
    const { data: notes } = useGetNotes()
    const { mutate: createNote } = useCreateNote()
    const { mutate: modifyNote, isError, isLoading } = useModifyNote()
    const { data: userInfo } = useGetUserInfo()
    const [noteTitle, setNoteTitle] = useState('')
    const [noteBody, setNoteBody] = useState('')
    const [optimisticId, setOptimisticId] = useState<string | undefined>(undefined)
    const [realId, setRealId] = useState<string | undefined>(undefined)
    const [isEditing, setIsEditing] = useState(false)
    const [syncIndicatorText, setSyncIndicatorText] = useState(SYNC_MESSAGES.COMPLETE)
    const timer = useRef<{ timeout: NodeJS.Timeout; callback: () => void }>()
    const toast = useToast()
    const navigate = useNavigate()

    useEffect(() => {
        if (isEditing || isLoading) {
            setSyncIndicatorText(SYNC_MESSAGES.SYNCING)
        } else if (isError) {
            setSyncIndicatorText(SYNC_MESSAGES.ERROR)
        } else if (noteBody || noteTitle) {
            setSyncIndicatorText('Your note has been saved')
        } else {
            setSyncIndicatorText('Your note will be saved automatically')
        }
    }, [isOpen, isError, isLoading, isEditing])

    const copyNoteLink = () => {
        navigator.clipboard.writeText(getNoteURL(realId || ''))
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
    }

    const onEdit = (
        { title, body, shared_until }: { title?: string; body?: string; shared_until?: string },
        timeoutOverride?: number
    ) => {
        if (title) setNoteTitle(title)
        if (body) setNoteBody(body)
        setIsEditing(true)
        if (timer.current) clearTimeout(timer.current.timeout)
        timer.current = {
            timeout: setTimeout(
                () => handleSave({ title: title ?? noteTitle, body: body ?? noteBody, shared_until }),
                timeoutOverride ?? NOTE_SYNC_TIMEOUT
            ),
            callback: () => handleSave({ title: title ?? noteTitle, body: body ?? noteBody, shared_until }),
        }
    }

    const handleSave = ({ title, body, shared_until }: { title: string; body: string; shared_until?: string }) => {
        setIsEditing(false)
        if (timer.current) clearTimeout(timer.current.timeout)

        if (realId) {
            modifyNote({
                id: realId,
                title: title || NO_TITLE,
                body: body,
                shared_until,
            })
        } else if (!optimisticId) {
            const newOptimisticNoteId = uuidv4()
            createNote({
                title: title || NO_TITLE,
                body: body,
                author: userInfo?.name || 'Anonymous',
                optimisticId: newOptimisticNoteId,
                shared_until: shared_until,
                callback: (data) => {
                    setRealId(data.note_id)
                    setOptimisticId(undefined)
                },
            })
            setOptimisticId(newOptimisticNoteId)
        } else {
            modifyNote(
                {
                    id: optimisticId,
                    title: title || NO_TITLE,
                    body: body,
                    shared_until,
                },
                optimisticId
            )
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        const keyCode = getKeyCode(e)
        if (
            keyCode === KEYBOARD_SHORTCUTS.close.key ||
            keyCode === KEYBOARD_SHORTCUTS.submit.key ||
            KEYBOARD_SHORTCUTS.newNote.key.split('|').some((key) => key === keyCode)
        ) {
            setIsOpen(false)
        }
        stopKeydownPropogation(e, undefined, true)
    }

    useEffect(() => {
        if (!isOpen) {
            // If this is the user's first note, we navigate to the notes page the modal is closed (learnability)
            if ((isEditing && notes?.length === 0) || ((realId || optimisticId) && notes?.length === 1)) {
                navigate('/notes')
            }

            setNoteTitle('')
            setNoteBody('')
            setOptimisticId(undefined)
            setRealId(undefined)
        }
    }, [isOpen])

    return (
        <GTModal
            open={isOpen}
            setIsModalOpen={setIsOpen}
            size="md"
            tabs={{
                body: (
                    <Flex column gap={Spacing._12} onKeyDown={handleKeyDown}>
                        <Flex>
                            <GTTextField
                                type="plaintext"
                                value={noteTitle}
                                onChange={(title) => onEdit({ title })}
                                placeholder="Note Title"
                                keyDownExceptions={[KEYBOARD_SHORTCUTS.close.key, KEYBOARD_SHORTCUTS.submit.key]}
                                enterBehavior="disable"
                                fontSize="medium"
                            />
                        </Flex>
                        <Flex data-autofocus>
                            <GTTextField
                                type="markdown"
                                value={noteBody}
                                onChange={(body) => onEdit({ body })}
                                fontSize="small"
                                placeholder="Type your note here. It will be saved automatically."
                                keyDownExceptions={[
                                    KEYBOARD_SHORTCUTS.close.key,
                                    KEYBOARD_SHORTCUTS.submit.key,
                                    KEYBOARD_SHORTCUTS.newNote.key,
                                ]}
                                minHeight={300}
                                autoFocus
                            />
                        </Flex>
                        <Flex justifyContent="space-between" alignItems="center">
                            <Label color="light">{syncIndicatorText}</Label>
                            <GTButton
                                value="Share note"
                                styleType="secondary"
                                size="small"
                                icon={icons.share}
                                disabled={!realId}
                                onClick={() => {
                                    onEdit(
                                        {
                                            title: noteTitle,
                                            body: noteBody,
                                            shared_until: DateTime.local().plus({ months: 3 }).toISO(),
                                        },
                                        0
                                    )
                                    copyNoteLink()
                                }}
                            />
                        </Flex>
                    </Flex>
                ),
            }}
        />
    )
}

export default NoteCreateModal
