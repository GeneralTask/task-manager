import { useCallback, useState } from 'react'
import { useKeyboardShortcut } from '../../hooks'
import { icons } from '../../styles/images'
import GTIconButton from '../atoms/buttons/GTIconButton'
import NoteCreateModal from './NoteCreateModal'

const NoteCreateButton = () => {
    const [modalIsOpen, setModalIsOpen] = useState(false)

    useKeyboardShortcut(
        'newNote',
        useCallback(() => setModalIsOpen(true), [])
    )

    return (
        <>
            <GTIconButton icon={icons.note} onClick={() => setModalIsOpen(true)} />
            <NoteCreateModal isOpen={modalIsOpen} setIsOpen={setModalIsOpen} />
        </>
    )
}

export default NoteCreateButton
