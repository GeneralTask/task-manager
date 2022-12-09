import { useCallback, useLayoutEffect, useState } from 'react'
import styled from 'styled-components'
import { v4 as uuidv4 } from 'uuid'
import KEYBOARD_SHORTCUTS from '../../constants/shortcuts'
import { useGTLocalStorage, useKeyboardShortcut } from '../../hooks'
import { useCreateNote } from '../../services/api/notes.hooks'
import { useGetUserInfo } from '../../services/api/user-info.hooks'
import { Spacing } from '../../styles'
import { icons } from '../../styles/images'
import { getKeyCode, stopKeydownPropogation } from '../../utils/utils'
import Flex from '../atoms/Flex'
import GTTextField from '../atoms/GTTextField'
import GTButton from '../atoms/buttons/GTButton'
import GTModal from '../mantine/GTModal'

const TitleField = styled(GTTextField)``
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
    const [note, setNote] = useGTLocalStorage('noteCreation', '')

    useLayoutEffect(() => {
        if (coupledTitle) {
            setTitle(note.split('\n')[0] || 'New Note')
        }
        if (!title) {
            setCoupledTitle(true)
        }
    }, [note, coupledTitle])

    const finishNote = useCallback(() => {
        if (!note || !isOpen) return

        const noteId = uuidv4()
        createNote({
            title: title,
            body: note,
            author: userInfo?.name ?? 'Anonymous',
            optimisticId: noteId,
        })

        setIsOpen(false)
        setNote('')
    }, [note, title, isOpen])

    useKeyboardShortcut('submit', finishNote)

    const handleKeyDown = (e: React.KeyboardEvent) => {
        const keyCode = getKeyCode(e)
        if (keyCode === KEYBOARD_SHORTCUTS.submit.key) {
            finishNote()
        }
        stopKeydownPropogation(e, undefined, true)
    }

    return (
        <GTModal
            open={isOpen}
            setIsModalOpen={setIsOpen}
            size="lg"
            tabs={{
                title: 'Note',
                body: (
                    <Flex column gap={Spacing._12} onKeyDown={handleKeyDown}>
                        <Flex>
                            <TitleField
                                type="plaintext"
                                value={title}
                                onChange={(val) => {
                                    setTitle(val)
                                    setCoupledTitle(false)
                                }}
                                fontSize="medium"
                            />
                        </Flex>
                        <Flex data-autofocus>
                            <GTTextField
                                type="markdown"
                                value={note}
                                onChange={(val) => setNote(val)}
                                fontSize="small"
                                placeholder="Type your note here."
                                keyDownExceptions={[KEYBOARD_SHORTCUTS.submit.key, KEYBOARD_SHORTCUTS.close.key]}
                                minHeight={300}
                                actions={
                                    <ShareButton
                                        onClick={finishNote}
                                        value="Save note"
                                        icon={icons.save}
                                        styleType="secondary"
                                        size="small"
                                        fitContent
                                    />
                                }
                                autoFocus
                            />
                        </Flex>
                    </Flex>
                ),
            }}
        />
    )
}

export default NoteCreateModal
