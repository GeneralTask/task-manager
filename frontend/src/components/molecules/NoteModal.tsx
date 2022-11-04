import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import styled from 'styled-components'
import { useLocalStorage } from 'usehooks-ts'
import { v4 as uuidv4 } from 'uuid'
import { DEFAULT_SECTION_ID } from '../../constants'
import KEYBOARD_SHORTCUTS from '../../constants/shortcuts'
import { useKeyboardShortcut, useToast } from '../../hooks'
import { useCreateTask } from '../../services/api/tasks.hooks'
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

const NoteModal = () => {
    const [modalIsOpen, setModalIsOpen] = useState(false)
    const [coupledTitle, setCoupledTitle] = useState(true)
    const [title, setTitle] = useState('New Note')
    const [note, setNote] = useLocalStorage('note', '')
    const { mutate: createTask } = useCreateTask()

    const toast = useToast()

    useLayoutEffect(() => {
        if (coupledTitle) {
            setTitle(note.split('\n')[0] || 'New Note')
        }
        if (!title) {
            setCoupledTitle(true)
        }
    }, [note, coupledTitle])

    const createAndShareNote = () => {
        if (!note || !modalIsOpen) return

        const noteId = uuidv4()
        createTask({
            title: title,
            body: note,
            taskSectionId: DEFAULT_SECTION_ID,
            optimisticId: noteId,
            is_note: true,
        })

        setNote('')
        setModalIsOpen(false)

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
    }

    useKeyboardShortcut(
        'newNote',
        useCallback(() => setModalIsOpen(true), [])
    )
    useKeyboardShortcut('submitText', () => createAndShareNote())

    return (
        <>
            <GTButton
                value="New Note"
                icon={icons.pencil}
                styleType="secondary"
                size="small"
                onClick={() => setModalIsOpen(true)}
            />
            <GTModal
                open={modalIsOpen}
                setIsModalOpen={setModalIsOpen}
                size="lg"
                tabs={{
                    // title: titleOfNote || 'New Note',
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
        </>
    )
}

export default NoteModal
