import { ReactNode, useCallback, useMemo, useState } from 'react'
import { DEFAULT_FOLDER_ID } from '../../constants'
import { useKeyboardShortcut } from '../../hooks'
import { useGetFolders } from '../../services/api/folders.hooks'
import { icons } from '../../styles/images'
import { TTaskSection } from '../../utils/types'
import GTDropdownMenu from '../radix/GTDropdownMenu'

interface FolderSelectorProps {
    value: string
    onChange: (value: string) => void
    renderTrigger: (isOpen: boolean, setIsOpen: (isOpen: boolean) => void, selectedFolder?: TTaskSection) => ReactNode
    useTriggerWidth?: boolean
    fontStyle?: 'body' | 'bodySmall' | 'label'
    enableKeyboardShortcut?: boolean
}
const FolderSelector = ({
    value,
    onChange,
    renderTrigger,
    enableKeyboardShortcut,
    useTriggerWidth,
    fontStyle,
}: FolderSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const { data: folders } = useGetFolders(false)

    const selectedFolder = useMemo(() => folders?.find((folder) => folder.id === value), [folders, value])

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
            unstyledTrigger
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
            trigger={renderTrigger(isOpen, setIsOpen, selectedFolder)}
        />
    )
}

export default FolderSelector
