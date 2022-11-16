import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { useGetOverviewViews } from '../../services/api/overview.hooks'
import { useGetTasks } from '../../services/api/tasks.hooks'
import { Border, Colors, Spacing } from '../../styles'
import { TTask } from '../../utils/types'
import { useCalendarContext } from './CalendarContext'
import TaskDueBody from './TaskDueBody'
import TasksDueHeader from './TasksDueHeader'

export const CONTAINER_MAX_HEIGHT = '130px'

export const TasksDueContainer = styled.div<{ isFocusModeCalendar: boolean }>`
    background-color: ${Colors.background.white};
    padding: ${Spacing._16} ${Spacing._12};
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
    const { isTasksDueViewCollapsed } = useCalendarContext()
    const location = useLocation()
    const isOnFocusMode = location.pathname.includes('focus-mode')
    const { data: taskFolders } = useGetTasks()
    const { data: lists } = useGetOverviewViews()
    const tasksDueToday = useMemo(() => {
        const meetingPrepTasks =
            (lists?.find((list) => list.type === 'meeting_preparation')?.view_items as TTask[]) || []
        const allTasks = taskFolders?.flatMap((section) => section.tasks).concat(meetingPrepTasks) ?? []
        const incompleteTasks = allTasks.filter((task) => !task.is_done && !task.is_deleted)
        return incompleteTasks.filter(
            (task) =>
                DateTime.fromISO(task.due_date).hasSame(date, 'day') ||
                (task.meeting_preparation_params &&
                    DateTime.fromISO(task.meeting_preparation_params.datetime_start).hasSame(date, 'day'))
        )
    }, [taskFolders, lists, date])

    if (tasksDueToday.length === 0) return null
    return (
        <TasksDueContainer isFocusModeCalendar={isOnFocusMode}>
            <TasksDueHeader type="day" numTasksDue={tasksDueToday.length} />
            {!isTasksDueViewCollapsed && <TaskDueBody tasksDue={tasksDueToday} />}
        </TasksDueContainer>
    )
}

export default TasksDue
