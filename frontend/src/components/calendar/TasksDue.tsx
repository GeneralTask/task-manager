import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { useGetTasks } from '../../services/api/tasks.hooks'
import { Border, Colors, Spacing } from '../../styles'
import { useCalendarContext } from './CalendarContext'
import TaskDueBody from './TaskDueBody'
import TasksDueHeader from './TasksDueHeader'

export const CONTAINER_MAX_HEIGHT = '130px'

export const TasksDueContainer = styled.div<{ hasTopBorder?: boolean }>`
    background-color: ${Colors.background.white};
    padding: ${Spacing._8} ${Spacing._12};
    ${({ hasTopBorder }) => hasTopBorder && `border-top: ${Border.stroke.medium} solid ${Colors.border.light};`}
    border-bottom: ${Border.stroke.medium} solid ${Colors.border.light};
    max-height: ${CONTAINER_MAX_HEIGHT};
    overflow-y: auto;
`

interface TasksDueProps {
    date: DateTime
}
const TasksDue = ({ date }: TasksDueProps) => {
    const { isTasksDueViewCollapsed, isTasksOverdueViewCollapsed } = useCalendarContext()
    const location = useLocation()
    const isOnFocusMode = location.pathname.includes('focus-mode')
    const { data: taskFolders } = useGetTasks()

    const incompleteTasks = useMemo(() => {
        const allTasks = taskFolders?.flatMap((section) => section.tasks) ?? []
        return allTasks.filter((task) => !task.is_done && !task.is_deleted)
    }, [taskFolders])

    const tasksDueToday = useMemo(
        () =>
            incompleteTasks.filter(
                (task) =>
                    DateTime.fromISO(task.due_date).hasSame(date, 'day') ||
                    (task.meeting_preparation_params &&
                        DateTime.fromISO(task.meeting_preparation_params.datetime_start).hasSame(date, 'day'))
            ),
        [incompleteTasks, date]
    )

    const tasksOverdue = useMemo(
        () =>
            incompleteTasks.filter(
                (task) =>
                    !DateTime.fromISO(task.due_date).hasSame(date, 'day') && DateTime.fromISO(task.due_date) < date
            ),
        [incompleteTasks, date]
    )

    return (
        <>
            {tasksDueToday.length > 0 && (
                <TasksDueContainer hasTopBorder={!isOnFocusMode}>
                    <TasksDueHeader type="day" dueType="due" numTasksDue={tasksDueToday.length} />
                    {!isTasksDueViewCollapsed && <TaskDueBody tasksDue={tasksDueToday} />}
                </TasksDueContainer>
            )}
            {tasksOverdue.length > 0 && (
                <TasksDueContainer>
                    <TasksDueHeader type="day" dueType="overdue" numTasksDue={tasksOverdue.length} />
                    {!isTasksOverdueViewCollapsed && <TaskDueBody tasksDue={tasksOverdue} showDueDate />}
                </TasksDueContainer>
            )}
        </>
    )
}

export default TasksDue
