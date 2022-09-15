import { useGetTasks, useReorderTask } from '../../services/api/tasks.hooks'
import { icons } from '../../styles/images'
import GTContextMenu, { GTContextMenuItem } from '../atoms/GTContextMenu'

interface TaskContextMenuProps {
    taskId: string
    sectionId?: string
    children: React.ReactNode
}
const TaskContextMenuWrapper = ({ taskId, sectionId, children }: TaskContextMenuProps) => {
    const { data: taskSections } = useGetTasks()
    const { mutate: reorderTask } = useReorderTask()

    const contextMenuItems: GTContextMenuItem[] = [
        {
            label: 'Priority',
            icon: icons.priority_urgent,
            subItems: [
                {
                    label: 'Urgent',
                    icon: icons.priority_urgent,
                },
                {
                    label: 'High',
                    icon: icons.priority_high,
                },
                {
                    label: 'Medium',
                    icon: icons.priority_medium,
                },
                {
                    label: 'Low',
                    icon: icons.priority_low,
                },
            ],
        },
        {
            label: 'Section',
            icon: icons.folder,
            subItems: taskSections
                ? [
                      ...taskSections
                          .filter((s) => !s.is_done)
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
        {
            label: 'Due date',
            icon: icons.timer,
        },
        {
            label: 'Delete task',
            icon: icons.trash,
            iconColor: 'red',
            textColor: 'red',
        },
    ]

    return <GTContextMenu items={contextMenuItems} trigger={children} />
}

export default TaskContextMenuWrapper
