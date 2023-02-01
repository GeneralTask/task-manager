import { useState } from 'react'
import { DateTime } from 'luxon'
import { v4 as uuidv4 } from 'uuid'
import { DEFAULT_SECTION_ID, EMPTY_MONGO_OBJECT_ID, TASK_PRIORITIES, TRASH_SECTION_ID } from '../../constants'
import { usePreviewMode } from '../../hooks'
import {
    useCreateTask,
    useGetTasks,
    useMarkTaskDoneOrDeleted,
    useModifyTask,
    useReorderTask,
} from '../../services/api/tasks.hooks'
import { icons, linearStatus } from '../../styles/images'
import { TTask } from '../../utils/types'
import GTDatePicker from '../molecules/GTDatePicker'
import RecurringTaskTemplateModal from '../molecules/recurring-tasks/RecurringTaskTemplateModal'
import GTContextMenu from './GTContextMenu'
import { GTMenuItem } from './RadixUIConstants'

const getDeleteLabel = (task: TTask, isSubtask: boolean) => {
    if (isSubtask) {
        if (task.is_deleted) {
            return 'Restore subtask'
        }
        return 'Delete subtask'
    }
    if (task.is_deleted) {
        return 'Restore task'
    }
    return 'Delete task'
}

interface TaskContextMenuProps {
    task: TTask
    sectionId?: string
    parentTask?: TTask
    children: React.ReactNode
    onOpenChange: (open: boolean) => void
}
const TaskContextMenuWrapper = ({ task, sectionId, parentTask, children, onOpenChange }: TaskContextMenuProps) => {
    const { data: taskSections } = useGetTasks(false)
    const { mutate: createTask } = useCreateTask()
    const { mutate: reorderTask } = useReorderTask()
    const { mutate: modifyTask } = useModifyTask()
    const { mutate: markTaskDoneOrDeleted } = useMarkTaskDoneOrDeleted()
    const [isRecurringTaskTemplateModalOpen, setIsRecurringTaskTemplateModalOpen] = useState(false)
    const { isPreviewMode } = usePreviewMode()

    const showRecurringTaskOption =
        task.source?.name === 'General Task' && // must be a native task
        (!task.recurring_task_template_id || task.recurring_task_template_id === EMPTY_MONGO_OBJECT_ID) && // and not already be a recurring task
        !parentTask

    const contextMenuItems: GTMenuItem[] = [
        ...(sectionId
            ? [
                  {
                      label: 'Move to folder',
                      icon: icons.folder,
                      subItems: taskSections
                          ? [
                                ...taskSections
                                    .filter((s) => !s.is_done && !s.is_trash)
                                    .map((section) => ({
                                        label: section.name,
                                        icon: section.id === DEFAULT_SECTION_ID ? icons.inbox : icons.folder,
                                        selected: section.id === sectionId,
                                        onClick: () => {
                                            reorderTask(
                                                {
                                                    id: task.id,
                                                    dropSectionId: section.id,
                                                    dragSectionId: sectionId,
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
                            setDate={(date) => {
                                if (parentTask && task) {
                                    modifyTask(
                                        { id: parentTask.id, dueDate: date, subtaskId: task.id },
                                        task.optimisticId
                                    )
                                } else {
                                    modifyTask({ id: task.id, dueDate: date }, task.optimisticId)
                                }
                            }}
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
                onClick: () => {
                    if (parentTask && task) {
                        modifyTask(
                            { id: parentTask.id, priorityNormalized: val, subtaskId: task.id },
                            task.optimisticId
                        )
                    } else {
                        modifyTask({ id: task.id, priorityNormalized: val }, task.optimisticId)
                    }
                },
            })),
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
                                  dueDate: task.due_date ?? '',
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
            label: getDeleteLabel(task, parentTask !== undefined),
            icon: icons.trash,
            iconColor: 'red',
            textColor: 'red',
            onClick: () => {
                if (parentTask && task) {
                    markTaskDoneOrDeleted(
                        { id: parentTask.id, isDeleted: sectionId !== TRASH_SECTION_ID, subtaskId: task?.id },
                        task.optimisticId
                    )
                } else {
                    markTaskDoneOrDeleted({ id: task.id, isDeleted: sectionId !== TRASH_SECTION_ID }, task.optimisticId)
                }
            },
        },
    ]
    return (
        <>
            <GTContextMenu items={contextMenuItems} trigger={children} onOpenChange={onOpenChange} />
            {isRecurringTaskTemplateModalOpen && (
                <RecurringTaskTemplateModal
                    initialTask={task}
                    initialFolderId={sectionId}
                    onClose={() => setIsRecurringTaskTemplateModalOpen(false)}
                />
            )}
        </>
    )
}

export default TaskContextMenuWrapper
