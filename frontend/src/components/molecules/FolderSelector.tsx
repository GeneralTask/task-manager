import { useCallback, useState } from 'react'
import { DEFAULT_FOLDER_ID } from '../../constants'
import { useKeyboardShortcut } from '../../hooks'
import { useGetFolders } from '../../services/api/folders.hooks'
import { icons } from '../../styles/images'
import GTButton from '../atoms/buttons/GTButton'
import GTDropdownMenu from '../radix/GTDropdownMenu'

interface FolderSelectorProps {
    value: string
    onChange: (value: string) => void
    useTriggerWidth?: boolean
    fontStyle?: 'deprecated_body' | 'deprecated_bodySmall' | 'deprecated_label'
    enableKeyboardShortcut?: boolean
}
const FolderSelector = ({
    value,
    onChange,
    enableKeyboardShortcut,
    useTriggerWidth,
    fontStyle,
}: FolderSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const { data: folders } = useGetFolders(false)

    useKeyboardShortcut(
        'moveTaskToFolder',
        useCallback(() => {
            setIsOpen(true)
        }, []),
        !enableKeyboardShortcut
    )

    return (
        <GTDropdownMenu
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            menuInModal
            fontStyle={fontStyle}
            useTriggerWidth={useTriggerWidth}
            items={
                folders
                    ? folders
                          .filter((s) => !s.is_done && !s.is_trash)
                          .map((folder) => ({
                              label: folder.name,
                              icon: folder.id === DEFAULT_FOLDER_ID ? icons.inbox : icons.folder,
                              selected: folder.id === value,
                              onClick: () => onChange(folder.id),
                          }))
                    : []
            }
            trigger={<GTButton icon={icons.folder} shortcutName="moveTaskToFolder" styleType="icon" />}
        />
    )
}

export default FolderSelector
