import { useCallback, useState } from 'react'
import { DEFAULT_SECTION_ID } from '../../constants'
import { useKeyboardShortcut } from '../../hooks'
import { useGetTasks, useReorderTask } from '../../services/api/tasks.hooks'
import { icons } from '../../styles/images'
import { TTask } from '../../utils/types'
import { getSectionFromTask } from '../../utils/utils'
import GTIconButton from '../atoms/buttons/GTIconButton'
import GTDropdownMenu from './GTDropdownMenu'

interface FolderDropdownProps {
    task: TTask
}
const FolderDropdown = ({ task }: FolderDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const { data: taskSections } = useGetTasks(false)
    const { mutate: reorderTask } = useReorderTask()

    useKeyboardShortcut(
        'moveTaskToFolder',
        useCallback(() => {
            setIsOpen(true)
        }, [])
    )

    const sectionId = taskSections && getSectionFromTask(taskSections, task.id)?.id

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
                              selected: section.id === sectionId,
                              onClick: () => {
                                  reorderTask({
                                      taskId: task.id,
                                      dropSectionId: section.id,
                                      dragSectionId: sectionId,
                                      orderingId: 1,
                                  })
                              },
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
