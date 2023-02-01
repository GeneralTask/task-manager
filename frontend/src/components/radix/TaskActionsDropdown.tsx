import { useState } from 'react'
import { DateTime } from 'luxon'
import { v4 as uuidv4 } from 'uuid'
import { DEFAULT_SECTION_ID, TRASH_SECTION_ID } from '../../constants'
import { usePreviewMode } from '../../hooks'
import { useCreateTask, useGetTasks, useMarkTaskDoneOrDeleted, useModifyTask } from '../../services/api/tasks.hooks'
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
    const { mutate: createTask } = useCreateTask()
    const { mutate: modifyTask } = useModifyTask()
    const { mutate: markTaskDoneOrDeleted } = useMarkTaskDoneOrDeleted()
    const { isPreviewMode } = usePreviewMode()

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
                        label: sectionId !== TRASH_SECTION_ID ? 'Delete task' : 'Restore task',
                        icon: icons.trash,
                        iconColor: 'red',
                        textColor: 'red',
                        onClick: () =>
                            markTaskDoneOrDeleted(
                                { id: task.id, isDeleted: sectionId !== TRASH_SECTION_ID },
                                task.optimisticId
                            ),
                    },
                    ...(isPreviewMode
                        ? [
                              {
                                  label: 'Duplicate task',
                                  icon: icons.clone,
                                  onClick: () => {
                                      const optimisticId = uuidv4()
                                      createTask({
                                          title: `${task.title} (copy)`,
                                          body: task.body,
                                          taskSectionId: sectionId || DEFAULT_SECTION_ID,
                                          optimisticId,
                                      })
                                      modifyTask(
                                          {
                                              id: optimisticId,
                                              priorityNormalized: task.priority_normalized,
                                              dueDate: task.due_date,
                                              recurringTaskTemplateId: task.recurring_task_template_id,
                                          },
                                          optimisticId
                                      )
                                  },
                              },
                          ]
                        : []),
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
            unstyledTrigger
            trigger={
                <GTIconButton
                    icon={icons.ellipsisVertical}
                    tooltipText="Task Actions"
                    onClick={() => setIsOpen(!isOpen)}
                    forceShowHoverEffect={isOpen}
                    asDiv
                />
            }
        />
    )
}

export default TaskActionsDropdown
