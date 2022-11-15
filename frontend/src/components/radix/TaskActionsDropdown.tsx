import { useState } from 'react'
import { DateTime } from 'luxon'
import { TRASH_SECTION_ID } from '../../constants'
import { useGetTasks, useMarkTaskDoneOrDeleted } from '../../services/api/tasks.hooks'
import { icons } from '../../styles/images'
import { TTask } from '../../utils/types'
import { getSectionFromTask } from '../../utils/utils'
import Flex from '../atoms/Flex'
import GTIconButton from '../atoms/buttons/GTIconButton'
import { Mini } from '../atoms/typography/Typography'
import GTDropdownMenu from './GTDropdownMenu'

interface TaskActionsDropdownProps {
    task: TTask
}
const TaskActionsDropdown = ({ task }: TaskActionsDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const { data: taskSections } = useGetTasks(false)
    const { mutate: markTaskDoneOrDeleted } = useMarkTaskDoneOrDeleted()

    const sectionId = getSectionFromTask(taskSections ?? [], task.id)?.id

    const updatedAt = DateTime.fromISO(task.updated_at).toFormat(`MMM d 'at' h:mm a`)
    const createdAt = DateTime.fromISO(task.created_at).toFormat(`MMM d 'at' h:mm a`)

    return (
        <GTDropdownMenu
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            hideCheckmark
            items={[
                [
                    {
                        label: sectionId !== TRASH_SECTION_ID ? 'Delete Task' : 'Restore Task',
                        icon: icons.trash,
                        iconColor: 'red',
                        textColor: 'red',
                        onClick: () =>
                            markTaskDoneOrDeleted(
                                { id: task.id, isDeleted: sectionId !== TRASH_SECTION_ID },
                                task.optimisticId
                            ),
                    },
                ],
                [
                    {
                        label: 'Info',
                        disabled: true,
                        renderer: () => (
                            <Flex column>
                                <Mini color="light">{`Last updated ${updatedAt}`}</Mini>
                                <Mini color="light">{`Created ${createdAt}`}</Mini>
                            </Flex>
                        ),
                    },
                ],
            ]}
            trigger={
                <GTIconButton
                    icon={icons.ellipsisVertical}
                    onClick={() => setIsOpen(!isOpen)}
                    forceShowHoverEffect={isOpen}
                    asDiv
                />
            }
        />
    )
}

export default TaskActionsDropdown
