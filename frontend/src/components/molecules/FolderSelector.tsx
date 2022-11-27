import { ReactNode, useCallback, useState } from 'react'
import { DEFAULT_SECTION_ID } from '../../constants'
import { useKeyboardShortcut } from '../../hooks'
import { useGetTasks } from '../../services/api/tasks.hooks'
import { icons } from '../../styles/images'
import GTDropdownMenu from '../radix/GTDropdownMenu'

interface FolderSelectorProps {
    value: string
    onChange: (value: string) => void
    renderTrigger: (isOpen: boolean, setIsOpen: (isOpen: boolean) => void) => ReactNode
}
const FolderSelector = ({ value, onChange, renderTrigger }: FolderSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const { data: taskSections } = useGetTasks(false)

    useKeyboardShortcut(
        'moveTaskToFolder',
        useCallback(() => {
            setIsOpen(true)
        }, [])
    )

    return (
        <GTDropdownMenu
            isOpen={isOpen}
            setIsOpen={setIsOpen}
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
            trigger={renderTrigger(isOpen, setIsOpen)}
        />
    )
}

export default FolderSelector
