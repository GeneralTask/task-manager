import { useCallback, useState } from 'react'
import { useKeyboardShortcut } from '../../hooks'
import { icons } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import GTButton from '../atoms/buttons/GTButton'
import { CollapsedIconContainer } from '../navigation_sidebar/NavigationLink'
import Tip from '../radix/Tip'
import NoteCreateModal from './NoteCreateModal'

interface NoteCreateButtonProps {
    type: 'icon' | 'button' | 'collapsed'
    disableShortcut?: boolean
}
const NoteCreateButton = ({ type, disableShortcut }: NoteCreateButtonProps) => {
    const [modalIsOpen, setModalIsOpen] = useState(false)

    useKeyboardShortcut(
        'newNote',
        useCallback(() => setModalIsOpen(true), []),
        disableShortcut
    )

    return (
        <>
            {type === 'icon' && (
                <GTButton
                    styleType="icon"
                    icon={icons.penToSquare}
                    onClick={() => setModalIsOpen(true)}
                    shortcutName="newNote"
                />
            )}
            {type === 'button' && (
                <GTButton
                    styleType="control"
                    value="Create new note"
                    icon={icons.penToSquare}
                    onClick={() => setModalIsOpen(true)}
                />
            )}
            {type === 'collapsed' && (
                <Tip shortcutName="newNote" side="right">
                    <CollapsedIconContainer onClick={() => setModalIsOpen(true)}>
                        <Icon icon={icons.penToSquare} />
                    </CollapsedIconContainer>
                </Tip>
            )}
            <NoteCreateModal isOpen={modalIsOpen} setIsOpen={setModalIsOpen} />
        </>
    )
}

export default NoteCreateButton
