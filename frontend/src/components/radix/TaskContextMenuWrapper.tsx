import { DateTime } from 'luxon'
import { TASK_PRIORITIES } from '../../constants'
import { useGetTasks, useModifyTask, useReorderTask } from '../../services/api/tasks.hooks'
import { icons } from '../../styles/images'
import { TTask } from '../../utils/types'
import GTDatePicker from '../molecules/GTDatePicker'
import GTContextMenu from './GTContextMenu'
import { GTMenuItem } from './RadixUIConstants'

interface TaskContextMenuProps {
    task: TTask
    sectionId?: string
    children: React.ReactNode
}
const TaskContextMenuWrapper = ({ task, sectionId, children }: TaskContextMenuProps) => {
    const { data: taskSections } = useGetTasks(false)
    const { mutate: reorderTask } = useReorderTask()
    const { mutate: modifyTask } = useModifyTask()

    const contextMenuItems: GTMenuItem[] = [
        {
            label: 'Set Priority',
            icon: icons.priority,
            subItems: [
                ...TASK_PRIORITIES.map((priority, val) => ({
                    label: priority.label,
                    icon: priority.icon,
                    selected: val === task.priority_normalized,
                    iconColor: priority.color,
                    onClick: () => modifyTask({ id: task.id, priorityNormalized: val }),
                })),
            ],
        },
        {
            label: 'Move to Folder',
            icon: icons.folder,
            subItems: taskSections
                ? [
                      ...taskSections
                          .filter((s) => !s.is_done && !s.is_trash)
                          .map((section) => ({
                              label: section.name,
                              icon: icons.folder,
                              selected: section.id === sectionId,
                              onClick: () => {
                                  reorderTask({
                                      taskId: task.id,
                                      dropSectionId: section.id,
                                      dragSectionId: sectionId,
                                      orderingId: 1,
                                  })
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
                            setDate={(date) => modifyTask({ id: task.id, dueDate: date })}
                            onlyCalendar
                        />
                    ),
                },
            ],
        },
        // {
        //     label: 'Delete task',
        //     icon: icons.trash,
        //     iconColor: 'red',
        //     textColor: 'red',
        // },
    ]

    return <GTContextMenu items={contextMenuItems} trigger={children} />
}

export default TaskContextMenuWrapper
