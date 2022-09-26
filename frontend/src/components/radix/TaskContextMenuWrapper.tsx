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
    folderId?: string
    children: React.ReactNode
}
const TaskContextMenuWrapper = ({ task, folderId, children }: TaskContextMenuProps) => {
    const { data: taskFolders } = useGetTasks(false)
    const { mutate: reorderTask } = useReorderTask()
    const { mutate: modifyTask } = useModifyTask()

    const contextMenuItems: GTMenuItem[] = [
        {
            label: 'Priority',
            icon: icons.priority_urgent,
            subItems: [
                ...TASK_PRIORITIES.map((priority, val) => ({
                    label: priority.label,
                    onClick: () => modifyTask({ id: task.id, priorityNormalized: val }),
                    icon: priority.icon,
                })),
            ],
        },
        {
            label: 'Folder',
            icon: icons.folder,
            subItems: taskFolders
                ? [
                      ...taskFolders
                          .filter((s) => !s.is_done && !s.is_trash)
                          .map((folder) => ({
                              label: folder.name,
                              icon: icons.folder,
                              selected: folder.id === folderId,
                              onClick: () => {
                                  reorderTask({
                                      taskId: task.id,
                                      dropFolderId: folder.id,
                                      dragFolderId: folderId,
                                      orderingId: 1,
                                  })
                              },
                          })),
                  ]
                : [],
        },
        {
            label: 'Due date',
            icon: icons.timer,
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
