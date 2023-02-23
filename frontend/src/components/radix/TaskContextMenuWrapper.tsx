import { useState } from 'react'
import { DateTime } from 'luxon'
import { v4 as uuidv4 } from 'uuid'
import { DEFAULT_FOLDER_ID, EMPTY_MONGO_OBJECT_ID, TASK_PRIORITIES, TRASH_FOLDER_ID } from '../../constants'
import { useGetFolders } from '../../services/api/folders.hooks'
import { useCreateTask, useMarkTaskDoneOrDeleted, useModifyTask, useReorderTask } from '../../services/api/tasks.hooks'
import { useGetTasksV4 } from '../../services/api/tasksv4.hooks'
import { icons, linearStatus } from '../../styles/images'
import { TTaskV4 } from '../../utils/types'
import GTDatePicker from '../molecules/GTDatePicker'
import RecurringTaskTemplateModal from '../molecules/recurring-tasks/RecurringTaskTemplateModal'
import GTContextMenu from './GTContextMenu'
import { GTMenuItem } from './RadixUIConstants'

const getDeleteLabel = (task: TTaskV4) => {
    if (task.is_deleted) {
        return 'Restore task'
    }
    return 'Delete task'
}

interface TaskContextMenuProps {
    task: TTaskV4
    children: React.ReactNode
    onOpenChange: (open: boolean) => void
}
const TaskContextMenuWrapper = ({ task, children, onOpenChange }: TaskContextMenuProps) => {
    const { data: allTasks } = useGetTasksV4(false)
    const { data: folders } = useGetFolders(false)
    const { mutate: createTask } = useCreateTask()
    const { mutate: reorderTask } = useReorderTask()
    const { mutate: modifyTask } = useModifyTask()
    const { mutate: markTaskDoneOrDeleted } = useMarkTaskDoneOrDeleted()
    const [isRecurringTaskTemplateModalOpen, setIsRecurringTaskTemplateModalOpen] = useState(false)

    const parentTask = allTasks?.find((t) => t.id === task.id_parent)

    const showRecurringTaskOption =
        task.source?.name === 'General Task' && // must be a native task
        (!task.recurring_task_template_id || task.recurring_task_template_id === EMPTY_MONGO_OBJECT_ID) && // and not already be a recurring task
        !parentTask

    const contextMenuItems: GTMenuItem[] = [
        ...(task.id_folder
            ? [
                  {
                      label: 'Move to folder',
                      icon: icons.folder,
                      subItems: folders
                          ? [
                                ...folders
                                    .filter((folder) => !folder.is_done && !folder.is_trash)
                                    .map((folder) => ({
                                        label: folder.name,
                                        icon: folder.id === DEFAULT_FOLDER_ID ? icons.inbox : icons.folder,
                                        selected: folder.id === task.id_folder,
                                        onClick: () => {
                                            reorderTask(
                                                {
                                                    id: task.id,
                                                    dropSectionId: folder.id,
                                                    dragSectionId: task.id_folder,
                                                    orderingId: 1,
                                                },
                                                task.optimisticId
                                            )
                                        },
                                    })),
                            ]
                          : [],
                  },
              ]
            : []),
        {
            label: 'Set due date',
            icon: icons.clock,
            subItems: [
                {
                    label: 'Calendar',
                    renderer: () => (
                        <GTDatePicker
                            initialDate={DateTime.fromISO(task.due_date)}
                            setDate={(date) => modifyTask({ id: task.id, dueDate: date }, task.optimisticId)}
                            onlyCalendar
                        />
                    ),
                },
            ],
        },
        {
            label: 'Set priority',
            icon: icons.priority,
            subItems: TASK_PRIORITIES.map((priority, val) => ({
                label: priority.label,
                icon: priority.icon,
                selected: val === task.priority_normalized,
                iconColor: priority.color,
                onClick: () => modifyTask({ id: task.id, priorityNormalized: val }, task.optimisticId),
            })),
        },
        ...(!task.is_deleted && !task.is_done
            ? [
                  {
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
                      },
                  },
              ]
            : []),
        ...(task.all_statuses && task.external_status
            ? [
                  {
                      label: 'Set status',
                      icon: linearStatus[task.external_status.type],
                      subItems: task.all_statuses.map((status) => ({
                          label: status.state,
                          onClick: () => modifyTask({ id: task.id, status: status }, task.optimisticId),
                          icon: linearStatus[status.type],
                          selected: status.state === task.external_status?.state,
                      })),
                  },
              ]
            : []),
        ...(showRecurringTaskOption
            ? [
                  {
                      label: 'Create a recurring task',
                      icon: icons.arrows_repeat,
                      onClick: () => setIsRecurringTaskTemplateModalOpen(true),
                  },
              ]
            : []),
        {
            label: getDeleteLabel(task),
            icon: icons.trash,
            iconColor: 'red',
            textColor: 'red',
            onClick: () => {
                markTaskDoneOrDeleted({ id: task.id, isDeleted: task.id_folder !== TRASH_FOLDER_ID }, task.optimisticId)
            },
        },
    ]
    return (
        <>
            <GTContextMenu items={contextMenuItems} trigger={children} onOpenChange={onOpenChange} />
            {isRecurringTaskTemplateModalOpen && (
                <RecurringTaskTemplateModal
                    initialTask={task}
                    initialFolderId={task.id_folder}
                    onClose={() => setIsRecurringTaskTemplateModalOpen(false)}
                />
            )}
        </>
    )
}

export default TaskContextMenuWrapper
