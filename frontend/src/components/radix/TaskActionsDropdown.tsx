import { useState } from 'react'
import { DateTime } from 'luxon'
import { v4 as uuidv4 } from 'uuid'
import { DEFAULT_FOLDER_ID } from '../../constants'
import { useToast } from '../../hooks'
import { useGetFolders } from '../../services/api/folders.hooks'
import { useCreateTask, useMarkTaskDoneOrDeleted, useModifyTask, useReorderTask } from '../../services/api/tasks.hooks'
import { icons } from '../../styles/images'
import { TTaskV4 } from '../../utils/types'
import Flex from '../atoms/Flex'
import GTButton from '../atoms/buttons/GTButton'
import { DeprecatedMini } from '../atoms/typography/Typography'
import GTDropdownMenu from './GTDropdownMenu'
import { GTMenuItem } from './RadixUIConstants'
import { getDeleteLabel } from './TaskContextMenuWrapper'

interface TaskActionsDropdownProps {
    task: TTaskV4
}
const TaskActionsDropdown = ({ task }: TaskActionsDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const { data: folders } = useGetFolders()
    const { mutate: createTask } = useCreateTask()
    const { mutate: modifyTask } = useModifyTask()
    const { mutate: reorderTask } = useReorderTask()
    const { mutate: markTaskDoneOrDeleted } = useMarkTaskDoneOrDeleted()
    const toast = useToast()

    const updatedAt = DateTime.fromISO(task.updated_at).toFormat(`MMM d 'at' h:mm a`)
    const createdAt = DateTime.fromISO(task.created_at).toFormat(`MMM d 'at' h:mm a`)

    const getDuplicateTaskAction = (): GTMenuItem => ({
        label: 'Duplicate task',
        icon: icons.clone,
        onClick: () => {
            const optimisticId = uuidv4()
            createTask({
                title: `${task.title} (copy)`,
                body: task.body,
                id_folder: task.id_folder,
                id_parent: task.id_parent,
                optimisticId,
            })
            modifyTask(
                {
                    id: optimisticId,
                    priorityNormalized: task.priority_normalized || undefined,
                    dueDate: DateTime.fromISO(task.due_date).toISO() || undefined,
                    recurringTaskTemplateId: task.recurring_task_template_id || undefined,
                },
                optimisticId
            )
            reorderTask(
                {
                    id: optimisticId,
                    dropSectionId: task.id_folder || DEFAULT_FOLDER_ID,
                    orderingId: task.id_ordering + 2,
                },
                optimisticId
            )
            toast.show({
                message: `Task duplicated in folder ${
                    folders?.find((f) => f.id === task.id_folder)?.name ?? 'Task Inbox'
                }`,
            })
        },
    })

    const getDeleteTaskAction = (): GTMenuItem => ({
        label: getDeleteLabel(task),
        icon: icons.trash,
        iconColor: 'red',
        textColor: 'red',
        onClick: () => markTaskDoneOrDeleted({ id: task.id, isDeleted: !task.is_deleted }, task.optimisticId),
    })

    const getTaskInfo = (): GTMenuItem => ({
        label: 'Info',
        disabled: true,
        renderer: () => (
            <Flex column>
                <DeprecatedMini color="light">{`Last updated ${updatedAt}`}</DeprecatedMini>
                <DeprecatedMini color="light">{`Created ${createdAt}`}</DeprecatedMini>
            </Flex>
        ),
    })

    const getItems = (): GTMenuItem[] | GTMenuItem[][] => {
        if (task.source.name === 'Jira' || task.is_deleted) {
            return [getTaskInfo()]
        }
        if (task.is_done) {
            return [[getDeleteTaskAction()], [getTaskInfo()]]
        }
        return [[getDuplicateTaskAction(), getDeleteTaskAction()], [getTaskInfo()]]
    }

    return (
        <GTDropdownMenu
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            hideCheckmark
            items={getItems()}
            trigger={
                <GTButton
                    styleType="icon"
                    icon={icons.ellipsisVertical}
                    tooltipText="Task Actions"
                    onClick={() => setIsOpen(!isOpen)}
                    active={isOpen}
                />
            }
        />
    )
}

export default TaskActionsDropdown
