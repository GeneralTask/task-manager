import { useCallback, useState } from 'react'
import { useKeyboardShortcut } from '../../hooks'
import { icons } from '../../styles/images'
import GTButton from '../atoms/buttons/GTButton'
import GTIconButton from '../atoms/buttons/GTIconButton'
import NoteCreateModal from './NoteCreateModal'

interface NoteCreateButtonProps {
    type: 'icon' | 'button'
}
const NoteCreateButton = ({ type }: NoteCreateButtonProps) => {
    const [modalIsOpen, setModalIsOpen] = useState(false)

    useKeyboardShortcut(
        'newNote',
        useCallback(() => setModalIsOpen(true), [])
    )

    return (
        <>
            {type === 'icon' && (
                <GTIconButton icon={icons.note} onClick={() => setModalIsOpen(true)} shortcutName="newNote" />
            )}
            {type === 'button' && (
                <GTButton
                    size="small"
                    styleType="secondary"
                    value="Create new note"
                    icon={icons.penToSquare}
                    onClick={() => setModalIsOpen(true)}
                />
            )}
            <NoteCreateModal isOpen={modalIsOpen} setIsOpen={setModalIsOpen} />
        </>
    )
}

export default NoteCreateButton
