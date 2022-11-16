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
    const { data: taskSections } = useGetTasks()
    const tasksDueToday = useMemo(() => {
        const allTasks = taskSections?.flatMap((section) => section.tasks) ?? []
        const incompleteTasks = allTasks.filter((task) => !task.is_done)
        return incompleteTasks.filter((task) => DateTime.fromISO(task.due_date).hasSame(date, 'day'))
    }, [taskSections, date])
    const tasksOverdue = useMemo(() => {
        const allTasks = taskSections?.flatMap((section) => section.tasks) ?? []
        const incompleteTasks = allTasks.filter((task) => !task.is_done)
        return incompleteTasks.filter(
            (task) => !DateTime.fromISO(task.due_date).hasSame(date, 'day') && DateTime.fromISO(task.due_date) < date
        )
    }, [taskSections, date])

    if (tasksDueToday.length === 0) return null
    return (
        <>
            <TasksDueContainer hasTopBorder={!isOnFocusMode}>
                <TasksDueHeader type="day" dueType="due" numTasksDue={tasksDueToday.length} />
                {!isTasksDueViewCollapsed && <TaskDueBody tasksDue={tasksDueToday} />}
            </TasksDueContainer>
            <TasksDueContainer>
                <TasksDueHeader type="day" dueType="overdue" numTasksDue={tasksOverdue.length} />
                {!isTasksOverdueViewCollapsed && <TaskDueBody tasksDue={tasksOverdue} showDueDate />}
            </TasksDueContainer>
        </>
    )
}

export default TasksDue
