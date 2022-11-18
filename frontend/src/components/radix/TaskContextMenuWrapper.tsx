import { DateTime } from 'luxon'
import { DEFAULT_SECTION_ID, TASK_PRIORITIES, TRASH_SECTION_ID } from '../../constants'
import { useGetTasks, useMarkTaskDoneOrDeleted, useModifyTask, useReorderTask } from '../../services/api/tasks.hooks'
import { icons, linearStatus } from '../../styles/images'
import { TTask } from '../../utils/types'
import GTDatePicker from '../molecules/GTDatePicker'
import GTContextMenu from './GTContextMenu'
import { GTMenuItem } from './RadixUIConstants'

interface TaskContextMenuProps {
    task: TTask
    sectionId?: string
    children: React.ReactNode
    onOpenChange: (open: boolean) => void
}
const TaskContextMenuWrapper = ({ task, sectionId, children, onOpenChange }: TaskContextMenuProps) => {
    const { data: taskSections } = useGetTasks(false)
    const { mutate: reorderTask } = useReorderTask()
    const { mutate: modifyTask } = useModifyTask()
    const { mutate: markTaskDoneOrDeleted } = useMarkTaskDoneOrDeleted()

    const contextMenuItems: GTMenuItem[] = [
        {
            label: 'Move to Folder',
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
        {
            label: 'Set Due Date',
            icon: icons.clock,
            subItems: [
                {
                    label: 'Calendar',
                    renderer: () => (
                        <GTDatePicker
                            initialDate={DateTime.fromISO(task.due_date).toJSDate()}
                            setDate={(date) => modifyTask({ id: task.id, dueDate: date }, task.optimisticId)}
                            onlyCalendar
                        />
                    ),
                },
            ],
        },
        {
            label: 'Set Priority',
            icon: icons.priority,
            subItems: TASK_PRIORITIES.map((priority, val) => ({
                label: priority.label,
                icon: priority.icon,
                selected: val === task.priority_normalized,
                iconColor: priority.color,
                onClick: () => modifyTask({ id: task.id, priorityNormalized: val }, task.optimisticId),
            })),
        },
        ...(task.all_statuses && task.external_status
            ? [
                  {
                      label: 'Set Status',
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
        {
            label: sectionId !== TRASH_SECTION_ID ? 'Delete Task' : 'Restore Task',
            icon: icons.trash,
            iconColor: 'red',
            textColor: 'red',
            onClick: () =>
                markTaskDoneOrDeleted({ id: task.id, isDeleted: sectionId !== TRASH_SECTION_ID }, task.optimisticId),
        },
    ]

    return <GTContextMenu items={contextMenuItems} trigger={children} onOpenChange={onOpenChange} />
}

export default TaskContextMenuWrapper
