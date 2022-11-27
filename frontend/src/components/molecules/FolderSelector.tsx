import { ReactNode, useCallback, useMemo, useState } from 'react'
import { DEFAULT_SECTION_ID } from '../../constants'
import { useKeyboardShortcut } from '../../hooks'
import { useGetTasks } from '../../services/api/tasks.hooks'
import { icons } from '../../styles/images'
import { TTaskSection } from '../../utils/types'
import GTDropdownMenu from '../radix/GTDropdownMenu'

interface FolderSelectorProps {
    value: string
    onChange: (value: string) => void
    renderTrigger: (isOpen: boolean, setIsOpen: (isOpen: boolean) => void, selectedFolder?: TTaskSection) => ReactNode
    enableKeyboardShortcut?: boolean
}
const FolderSelector = ({ value, onChange, renderTrigger, enableKeyboardShortcut }: FolderSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const { data: taskSections } = useGetTasks(false)

    const selectedFolder = useMemo(() => taskSections?.find((section) => section.id === value), [taskSections, value])

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
            items={
                taskSections
                    ? taskSections
                          .filter((s) => !s.is_done && !s.is_trash)
                          .map((section) => ({
                              label: section.name,
                              icon: section.id === DEFAULT_SECTION_ID ? icons.inbox : icons.folder,
                              selected: section.id === value,
                              onClick: () => onChange(section.id),
                          }))
                    : []
            }
            trigger={renderTrigger(isOpen, setIsOpen, selectedFolder)}
        />
    )
}

export default FolderSelector
