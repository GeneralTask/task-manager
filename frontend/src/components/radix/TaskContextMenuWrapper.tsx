import { useState } from 'react'
import { DateTime } from 'luxon'
import { v4 as uuidv4 } from 'uuid'
import { DEFAULT_FOLDER_ID, EMPTY_MONGO_OBJECT_ID, TASK_PRIORITIES } from '../../constants'
import useSelectionContext from '../../context/SelectionContextProvider'
import { useGetFolders } from '../../services/api/folders.hooks'
import {
    useCreateTask,
    useGetTasksV4,
    useMarkTaskDoneOrDeleted,
    useModifyTask,
    useReorderTask,
} from '../../services/api/tasks.hooks'
import { externalStatusIcons, icons } from '../../styles/images'
import { TTaskFolder, TTaskV4 } from '../../utils/types'
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

const getMoveFolderMenuItem = (
    task: TTaskV4,
    folders: TTaskFolder[],
    onFolderClick: (folderId: string) => void
): GTMenuItem => {
    return {
        label: 'Move to folder',
        icon: icons.folder,
        subItems: [
            ...folders
                .filter((f) => !f.is_done && !f.is_trash)
                .map((f) => ({
                    label: f.name,
                    icon: f.id === DEFAULT_FOLDER_ID ? icons.inbox : icons.folder,
                    selected: f.id === task.id_folder,
                    onClick: () => onFolderClick(f.id),
                })),
        ],
    }
}

const getSetDueDateMenuItem = (task: TTaskV4, setDate: (date: string) => void): GTMenuItem => {
    return {
        label: 'Set due date',
        icon: icons.clock,
        subItems: [
            {
                label: 'Calendar',
                renderer: () => (
                    <GTDatePicker initialDate={DateTime.fromISO(task.due_date)} setDate={setDate} onlyCalendar />
                ),
            },
        ],
    }
}

const getSetPriorityMenuItem = (task: TTaskV4, setPriority: (priority: number) => void): GTMenuItem => {
    return {
        label: 'Set priority',
        icon: icons.priority,
        subItems: TASK_PRIORITIES.map((priority, val) => ({
            label: priority.label,
            icon: priority.icon,
            selected: val === task.priority_normalized,
            iconColor: priority.color,
            onClick: () => setPriority(val),
        })),
    }
}

const getDeleteMenuItem = (task: TTaskV4, deleteTask: () => void): GTMenuItem => {
    return {
        label: getDeleteLabel(task),
        icon: icons.trash,
        iconColor: 'red',
        textColor: 'red',
        onClick: deleteTask,
    }
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
    const { mutate: reorderTask, mutateAsync: reorderTaskAsync } = useReorderTask(false)
    const { mutate: modifyTask } = useModifyTask(true)
    const { mutate: markTaskDoneOrDeleted } = useMarkTaskDoneOrDeleted(false)
    const [isRecurringTaskTemplateModalOpen, setIsRecurringTaskTemplateModalOpen] = useState(false)
    const { inMultiSelectMode, selectedTaskIds, clearSelectedTaskIds } = useSelectionContext()

    const parentTask = allTasks?.find((t) => t.id === task.id_parent)

    const showRecurringTaskOption =
        task.source?.name === 'General Task' && // must be a native task
        (!task.recurring_task_template_id || task.recurring_task_template_id === EMPTY_MONGO_OBJECT_ID) && // and not already be a recurring task
        !parentTask

    const onSingleSelectFolderClick = (folderId: string) => {
        reorderTask(
            {
                id: task.id,
                dropSectionId: folderId,
                dragSectionId: task.id_folder,
                orderingId: 1,
            },
            task.optimisticId
        )
    }
    const onMultiSelectFolderClick = (folderId: string) => {
        clearSelectedTaskIds()
        Promise.all(
            selectedTaskIds.map((id) =>
                reorderTaskAsync({
                    id,
                    dropSectionId: folderId,
                    dragSectionId: task.id_folder,
                    orderingId: 1,
                })
            )
        )
    }
    const onSingleSetDueDateClick = (date: string) => {
        modifyTask({ id: task.id, dueDate: date }, task.optimisticId)
    }
    const onMultiSetDueDateClick = (date: string) => {
        Promise.all(selectedTaskIds.map((id) => modifyTask({ id, dueDate: date })))
    }
    const onMultiSetPriorityClick = (priority: number) => {
        clearSelectedTaskIds()
        Promise.all(selectedTaskIds.map((id) => modifyTask({ id, priorityNormalized: priority })))
    }
    const onSingleDeleteClick = () => {
        markTaskDoneOrDeleted({ id: task.id, isDeleted: !task.is_deleted }, task.optimisticId)
    }
    const onMultiDeleteClick = () => {
        clearSelectedTaskIds()
        Promise.all(selectedTaskIds.map((id) => markTaskDoneOrDeleted({ id, isDeleted: !task.is_deleted })))
    }

    const getPriorityOption = (task: TTaskV4): GTMenuItem => {
        if (task.all_priorities) {
            return {
                label: 'Set priority',
                icon: icons.priority,
                subItems: task.all_priorities.map((priority) => ({
                    label: priority.name,
                    icon: priority.icon_url,
                    selected: priority.priority_normalized === task.priority_normalized,
                    onClick: () => {
                        if (parentTask && task) {
                            modifyTask(
                                {
                                    id: parentTask.id,
                                    external_priority_id: priority.external_id,
                                },
                                task.optimisticId
                            )
                        } else {
                            modifyTask({ id: task.id, external_priority_id: priority.external_id }, task.optimisticId)
                        }
                    },
                })),
            }
        }
        return {
            label: 'Set priority',
            icon: icons.priority,
            subItems: TASK_PRIORITIES.map((priority, val) => ({
                label: priority.label,
                icon: priority.icon,
                selected: val === task.priority_normalized,
                iconColor: priority.color,
                onClick: () => {
                    if (parentTask && task) {
                        modifyTask({ id: parentTask.id, priorityNormalized: val }, task.optimisticId)
                    } else {
                        modifyTask({ id: task.id, priorityNormalized: val }, task.optimisticId)
                    }
                },
            })),
        }
    }

    const contextMenuItems: GTMenuItem[] = [
        ...(task.id_folder && folders ? [getMoveFolderMenuItem(task, folders, onSingleSelectFolderClick)] : []),
        getSetDueDateMenuItem(task, onSingleSetDueDateClick),
        getPriorityOption(task),
        ...(!task.id_parent && !task.is_deleted && !task.is_done
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
                      icon: externalStatusIcons[task.external_status.type],
                      subItems: task.all_statuses.map((status) => ({
                          label: status.state,
                          onClick: () => modifyTask({ id: task.id, status: status }, task.optimisticId),
                          icon: externalStatusIcons[status.type],
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
        getDeleteMenuItem(task, onSingleDeleteClick),
    ]

    const multiSelectContextMenuItems: GTMenuItem[] = [
        ...(task.id_folder && folders ? [getMoveFolderMenuItem(task, folders, onMultiSelectFolderClick)] : []),
        getSetDueDateMenuItem(task, onMultiSetDueDateClick),
        getSetPriorityMenuItem(task, onMultiSetPriorityClick),
        getDeleteMenuItem(task, onMultiDeleteClick),
    ]
    return (
        <>
            <GTContextMenu
                items={inMultiSelectMode && !task.id_parent ? multiSelectContextMenuItems : contextMenuItems}
                trigger={children}
                onOpenChange={onOpenChange}
            />
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
