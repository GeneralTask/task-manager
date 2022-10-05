import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { useGetTasks } from '../../services/api/tasks.hooks'
import { Border, Colors, Spacing } from '../../styles'
import TaskDueBody from './TaskDueBody'
import TasksDueHeader from './TasksDueHeader'

export const CONTAINER_MAX_HEIGHT = '130px'

export const TasksDueContainer = styled.div<{ isFocusModeCalendar: boolean }>`
    background-color: ${Colors.background.white};
    padding: ${Spacing._16} ${Spacing._24};
    ${({ isFocusModeCalendar }) =>
        !isFocusModeCalendar && `border-top: ${Border.stroke.medium} solid ${Colors.border.light};`}
    border-bottom: ${Border.stroke.large} solid ${Colors.border.light};
    max-height: ${CONTAINER_MAX_HEIGHT};
    overflow-y: auto;
`

interface TasksDueProps {
    date: DateTime
}
const TasksDue = ({ date }: TasksDueProps) => {
    const [isCollapsed, setIsCollapsed] = useState(false)

    const location = useLocation()
    const isOnFocusMode = location.pathname.includes('focus-mode')
    const { data: taskSections } = useGetTasks()
    const tasksDueToday = useMemo(() => {
        const allTasks = taskSections?.flatMap((section) => section.tasks) ?? []
        const incompleteTasks = allTasks.filter((task) => !task.is_done)
        return incompleteTasks.filter((task) => DateTime.fromISO(task.due_date).hasSame(date, 'day'))
    }, [taskSections, date])

    return (
        <TasksDueContainer isFocusModeCalendar={isOnFocusMode}>
            <TasksDueHeader
                type="day"
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
                numTasksDue={tasksDueToday.length}
            />
            {!isCollapsed && <TaskDueBody tasksDue={tasksDueToday} />}
        </TasksDueContainer>
    )
}

export default TasksDue
