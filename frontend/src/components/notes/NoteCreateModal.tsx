import { useCallback, useLayoutEffect, useState } from 'react'
import styled from 'styled-components'
import { useLocalStorage } from 'usehooks-ts'
import { v4 as uuidv4 } from 'uuid'
import KEYBOARD_SHORTCUTS from '../../constants/shortcuts'
import { useKeyboardShortcut, useToast } from '../../hooks'
import { useCreateNote } from '../../services/api/notes.hooks'
import { useGetUserInfo } from '../../services/api/user-info.hooks'
import { icons } from '../../styles/images'
import Flex from '../atoms/Flex'
import GTTextField from '../atoms/GTTextField'
import GTButton from '../atoms/buttons/GTButton'
import GTModal from '../mantine/GTModal'

const TitleField = styled(GTTextField)`
    width: 890px;
`
const ShareButton = styled(GTButton)`
    margin-left: auto;
`

interface NoteCreateModalProps {
    isOpen: boolean
    setIsOpen: (isOpen: boolean) => void
}
const NoteCreateModal = ({ isOpen, setIsOpen }: NoteCreateModalProps) => {
    const { mutate: createNote } = useCreateNote()
    const { data: userInfo } = useGetUserInfo()
    const [coupledTitle, setCoupledTitle] = useState(true)
    const [title, setTitle] = useState('New Note')
    const [note, setNote] = useLocalStorage('note', '')

    const toast = useToast()

    useLayoutEffect(() => {
        if (coupledTitle) {
            setTitle(note.split('\n')[0] || 'New Note')
        }
        if (!title) {
            setCoupledTitle(true)
        }
    }, [note, coupledTitle])

    const createAndShareNote = useCallback(() => {
        if (!note || !isOpen) return

        const noteId = uuidv4()
        createNote({
            title: title,
            body: note,
            author: userInfo?.email ?? '',
            optimisticId: noteId,
        })

        setNote('')
        setIsOpen(false)

        const testingURL = `https://generaltask.com/notes/${noteId}` //TODO: change to actual URL

        navigator.clipboard.writeText(testingURL)
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
    }, [note, title, isOpen])

    useKeyboardShortcut('submitText', createAndShareNote)

    return (
        <GTModal
            open={isOpen}
            setIsModalOpen={setIsOpen}
            size="lg"
            tabs={{
                title: (
                    <TitleField
                        type="plaintext"
                        value={title}
                        onChange={(val) => {
                            setTitle(val)
                            setCoupledTitle(false)
                        }}
                        fontSize="medium"
                    />
                ),
                body: (
                    <Flex data-autofocus>
                        <GTTextField
                            type="markdown"
                            value={note}
                            onChange={(val) => setNote(val)}
                            fontSize="small"
                            placeholder="Type your note here. It will be saved automatically."
                            keyDownExceptions={[KEYBOARD_SHORTCUTS.submitText.key]}
                            minHeight={300}
                            actions={
                                <ShareButton
                                    onClick={createAndShareNote}
                                    value="Share Note"
                                    icon={icons.share}
                                    styleType="secondary"
                                    size="small"
                                    fitContent
                                />
                            }
                            autoFocus
                        />
                    </Flex>
                ),
            }}
        />
    )
}

export default NoteCreateModal