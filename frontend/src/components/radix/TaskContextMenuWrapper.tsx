import { PRIORITIES } from '../../constants'
import { useGetTasks, useModifyTask, useReorderTask } from '../../services/api/tasks.hooks'
import { icons } from '../../styles/images'
import GTContextMenu from './GTContextMenu'
import { GTMenuItem } from './RadixUIConstants'

interface TaskContextMenuProps {
    taskId: string
    sectionId?: string
    children: React.ReactNode
}
const TaskContextMenuWrapper = ({ taskId, sectionId, children }: TaskContextMenuProps) => {
    const { data: taskSections } = useGetTasks(false)
    const { mutate: reorderTask } = useReorderTask()
    const { mutate: modifyTask } = useModifyTask()

    const contextMenuItems: GTMenuItem[] = [
        {
            label: 'Priority',
            icon: icons.priority_urgent,
            subItems: [
                ...PRIORITIES.filter((priority) => !!priority.icon).map((priority) => ({
                    label: priority.label,
                    onClick: () => modifyTask({ id: taskId, priorityNormalized: priority.value }),
                    icon: priority.icon,
                })),
            ],
        },
        {
            label: 'Section',
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
                                      taskId: taskId,
                                      dropSectionId: section.id,
                                      dragSectionId: sectionId,
                                      orderingId: 1,
                                  })
                              },
                          })),
                  ]
                : [],
        },
        // {
        //     label: 'Due date',
        //     icon: icons.timer,
        // },
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
