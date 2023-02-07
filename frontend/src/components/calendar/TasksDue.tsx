import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import produce from 'immer'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { SINGLE_SECOND_INTERVAL } from '../../constants'
import { useInterval, useSetting } from '../../hooks'
import { useGetCalendars } from '../../services/api/events.hooks'
import { useGetTasks } from '../../services/api/tasks.hooks'
import { Border, Colors, Spacing } from '../../styles'
import { useCalendarContext } from './CalendarContext'
import TaskDueBody from './TaskDueBody'
import TasksDueHeader from './TasksDueHeader'

const CONTAINER_MAX_HEIGHT = '130px'

const TasksDueContainer = styled.div<{ hasTopBorder?: boolean }>`
    ${({ hasTopBorder }) => hasTopBorder && `border-top: ${Border.stroke.medium} solid ${Colors.border.light};`}
    border-bottom: ${Border.stroke.medium} solid ${Colors.border.light};
`
export const PaddedTasksScroll = styled.div`
    padding: 0 ${Spacing._12} ${Spacing._8};
    max-height: ${CONTAINER_MAX_HEIGHT};
    overflow-y: auto;
`

const useHasTopBorder = () => {
    const location = useLocation()
    const isOnFocusMode = location.pathname.includes('focus-mode')

    const { data: calendars } = useGetCalendars()
    const { field_value: hasDismissedMulticalPrompt } = useSetting('has_dismissed_multical_prompt')
    const isCalendarAuthBannerVisible = useMemo(() => {
        return (
            hasDismissedMulticalPrompt === 'false' &&
            calendars?.some((calendar) => !calendar.has_multical_scopes || !calendar.has_primary_calendar_scopes)
        )
    }, [hasDismissedMulticalPrompt, calendars])
    return !isOnFocusMode && !isCalendarAuthBannerVisible
}

interface TasksDueProps {
    date: DateTime
}
const TasksDue = ({ date }: TasksDueProps) => {
    const { isTasksDueViewCollapsed, isTasksOverdueViewCollapsed, setDate } = useCalendarContext()
    const { data: taskFolders } = useGetTasks()
    const [currentTime, setCurrentTime] = useState(DateTime.local())

    useInterval(
        () => {
            setCurrentTime(DateTime.local())
        },
        SINGLE_SECOND_INTERVAL,
        false
    )

    useEffect(() => {
        if (currentTime.hour === 0 && currentTime.minute === 0 && currentTime.second === 0) {
            setDate(DateTime.local())
        }
    }, [currentTime])

    const incompleteTasks = useMemo(() => {
        const allTasks = taskFolders?.flatMap((section) => section.tasks) ?? []
        const allSubtasks = allTasks
            .filter((task) => task.sub_tasks !== undefined)
            .map((task) => {
                return produce(task, (draft) => {
                    for (const subtask of draft.sub_tasks || []) {
                        subtask.parent_task_id = draft.id
                        subtask.isSubtask = true
                    }
                })
            })
            .flatMap((task) => task.sub_tasks || [])
        const allTasksAndSubtasks = [...allTasks, ...allSubtasks]
        return allTasksAndSubtasks.filter((task) => !task.is_done && !task.is_deleted)
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

    const hasTopBorder = useHasTopBorder()

    return (
        <>
            {tasksDueToday.length > 0 && (
                <TasksDueContainer hasTopBorder={hasTopBorder}>
                    <TasksDueHeader type="day" dueType="due" numTasksDue={tasksDueToday.length} date={date} />
                    {!isTasksDueViewCollapsed && (
                        <PaddedTasksScroll>
                            <TaskDueBody tasksDue={tasksDueToday} />
                        </PaddedTasksScroll>
                    )}
                </TasksDueContainer>
            )}
            {tasksOverdue.length > 0 && (
                <TasksDueContainer>
                    <TasksDueHeader type="day" dueType="overdue" numTasksDue={tasksOverdue.length} date={date} />
                    {!isTasksOverdueViewCollapsed && (
                        <PaddedTasksScroll>
                            <TaskDueBody tasksDue={tasksOverdue} showDueDate />
                        </PaddedTasksScroll>
                    )}
                </TasksDueContainer>
            )}
        </>
    )
}

export default TasksDue
