import { useEffect, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { NOTE_SYNC_TIMEOUT, NO_TITLE, SYNC_MESSAGES } from '../../constants'
import KEYBOARD_SHORTCUTS from '../../constants/shortcuts'
import { useCreateNote, useModifyNote } from '../../services/api/notes.hooks'
import { useGetUserInfo } from '../../services/api/user-info.hooks'
import { Spacing } from '../../styles'
import { getKeyCode, stopKeydownPropogation } from '../../utils/utils'
import Flex from '../atoms/Flex'
import GTTextField from '../atoms/GTTextField'
import { Label } from '../atoms/typography/Typography'
import GTModal from '../mantine/GTModal'

interface NoteCreateModalProps {
    isOpen: boolean
    setIsOpen: (isOpen: boolean) => void
}
const NoteCreateModal = ({ isOpen, setIsOpen }: NoteCreateModalProps) => {
    const { mutate: createNote } = useCreateNote()
    const { mutate: modifyNote, isError, isLoading } = useModifyNote()
    const { data: userInfo } = useGetUserInfo()
    const [optimisticId, setOptimisticId] = useState<string | undefined>(undefined)
    const [noteTitle, setNoteTitle] = useState('')
    const [noteBody, setNoteBody] = useState('')
    const [isEditing, setIsEditing] = useState(false)
    const [syncIndicatorText, setSyncIndicatorText] = useState(SYNC_MESSAGES.COMPLETE)
    const timer = useRef<{ timeout: NodeJS.Timeout; callback: () => void }>()

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

    const onEdit = ({ title, body }: { title?: string; body?: string }) => {
        if (title) setNoteTitle(title)
        if (body) setNoteBody(body)
        setIsEditing(true)
        if (timer.current) clearTimeout(timer.current.timeout)
        timer.current = {
            timeout: setTimeout(
                () => handleSave({ title: title ?? noteTitle, body: body ?? noteBody }),
                NOTE_SYNC_TIMEOUT
            ),
            callback: () => handleSave({ title: title ?? noteTitle, body: body ?? noteBody }),
        }
    }

    const handleSave = ({ title, body }: { title: string; body: string }) => {
        setIsEditing(false)
        if (timer.current) clearTimeout(timer.current.timeout)

        if (!optimisticId) {
            const newOptimisticNoteId = uuidv4()
            createNote({
                title: title || NO_TITLE,
                body: body,
                author: userInfo?.name || 'Anonymous',
                optimisticId: newOptimisticNoteId,
            })
            setOptimisticId(newOptimisticNoteId)
        } else {
            modifyNote(
                {
                    id: optimisticId,
                    title: title || NO_TITLE,
                    body: body,
                },
                optimisticId
            )
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        const keyCode = getKeyCode(e)
        if (keyCode === KEYBOARD_SHORTCUTS.close.key) {
            setIsOpen(false)
        }
        stopKeydownPropogation(e, undefined, true)
    }

    useEffect(() => {
        if (!isOpen) {
            setNoteTitle('')
            setNoteBody('')
            setOptimisticId(undefined)
        }
    }, [isOpen])

    return (
        <GTModal
            open={isOpen}
            setIsModalOpen={setIsOpen}
            size="lg"
            tabs={{
                body: (
                    <Flex column gap={Spacing._12} onKeyDown={handleKeyDown}>
                        <Flex>
                            <GTTextField
                                type="plaintext"
                                value={noteTitle}
                                onChange={(title) => onEdit({ title })}
                                placeholder="Note Title"
                                keyDownExceptions={[KEYBOARD_SHORTCUTS.close.key]}
                                fontSize="medium"
                                data-autofocus
                            />
                        </Flex>
                        <Flex>
                            <GTTextField
                                type="markdown"
                                value={noteBody}
                                onChange={(body) => onEdit({ body })}
                                fontSize="small"
                                placeholder="Type your note here. It will be saved automatically."
                                keyDownExceptions={[KEYBOARD_SHORTCUTS.close.key]}
                                minHeight={300}
                            />
                        </Flex>
                        <Label color="light">{syncIndicatorText}</Label>
                    </Flex>
                ),
            }}
        />
    )
}

export default NoteCreateModal
