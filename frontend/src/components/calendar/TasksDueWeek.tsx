import { useMemo } from 'react'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { useGetTasks } from '../../services/api/tasks.hooks'
import { Border, Colors, Spacing } from '../../styles'
import { icons } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import { useCalendarContext } from './CalendarContext'
import { CELL_TIME_WIDTH } from './CalendarEvents-styles'
import TaskDueBody from './TaskDueBody'
import { PaddedTasksScroll } from './TasksDue'
import TasksDueHeader from './TasksDueHeader'

const TasksDueWeekContainer = styled.div`
    display: flex;
    min-width: 0;
    height: fit-content;
    width: 100%;
    border-top: ${Border.stroke.medium} solid ${Colors.border.light};
    border-bottom: ${Border.stroke.large} solid ${Colors.border.light};
    background-color: ${Colors.background.white};
    padding-left: ${CELL_TIME_WIDTH};
    position: relative;
    box-sizing: border-box;
`
const TaskDueContainer = styled.div`
    flex: 1 1 0;
    min-width: 0;
    margin: 0 auto;
`
const AbsoluteCaretIcon = styled.div`
    position: absolute;
    top: ${Spacing._16};
    right: ${Spacing._12};
    cursor: pointer;
`

interface TasksDueWeekProps {
    date: DateTime
}
const TasksDueWeek = ({ date }: TasksDueWeekProps) => {
    const { data: taskSections } = useGetTasks()
    const { isTasksDueViewCollapsed, setIsTasksDueViewCollapsed } = useCalendarContext()
    const caretIcon = isTasksDueViewCollapsed ? icons.caret_right : icons.caret_down

    const tasksDueWeek = useMemo(() => {
        const allTasks = taskSections?.flatMap((section) => section.tasks) ?? []
        return [...Array(7)].map((_, offset) =>
            allTasks.filter((task) => DateTime.fromISO(task.due_date).hasSame(date.plus({ days: offset }), 'day'))
        )
    }, [taskSections, date])

    const anyTasksDueThisWeek = tasksDueWeek.some((tasks) => tasks.length > 0)
    if (!anyTasksDueThisWeek) return null
    return (
        <TasksDueWeekContainer>
            <AbsoluteCaretIcon onClick={() => setIsTasksDueViewCollapsed(!isTasksDueViewCollapsed)}>
                <Icon icon={caretIcon} />
            </AbsoluteCaretIcon>
            {[...Array(7)].map((_, index) => (
                <TaskDueContainer key={index}>
                    {tasksDueWeek[index].length > 0 && (
                        <>
                            <TasksDueHeader
                                type="week"
                                dueType="due"
                                numTasksDue={tasksDueWeek[index].length}
                                hideCollapseButton
                            />
                            {!isTasksDueViewCollapsed && (
                                <PaddedTasksScroll>
                                    <TaskDueBody tasksDue={tasksDueWeek[index]} />
                                </PaddedTasksScroll>
                            )}
                        </>
                    )}
                </TaskDueContainer>
            ))}
        </TasksDueWeekContainer>
    )
}

export default TasksDueWeek
