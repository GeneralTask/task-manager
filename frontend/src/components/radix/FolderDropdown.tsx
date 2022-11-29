import { useCallback, useState } from 'react'
import { DEFAULT_SECTION_ID } from '../../constants'
import { useKeyboardShortcut } from '../../hooks'
import { useGetTasks } from '../../services/api/tasks.hooks'
import { icons } from '../../styles/images'
import GTIconButton from '../atoms/buttons/GTIconButton'
import GTDropdownMenu from './GTDropdownMenu'

interface FolderDropdownProps {
    value: string
    onChange: (value: string) => void
}
const FolderDropdown = ({ value, onChange }: FolderDropdownProps) => {
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
            trigger={
                <GTIconButton
                    icon={icons.folder}
                    onClick={() => setIsOpen(!isOpen)}
                    forceShowHoverEffect={isOpen}
                    asDiv
                />
            }
        />
    )
}

export default FolderDropdown
