import { useMemo } from 'react'
import { scrollbarWidth } from '@xobotyi/scrollbar-width'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import useGetActiveTasks from '../../hooks/useGetActiveTasks'
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
    border-top: ${Border.stroke.medium} solid ${Colors.border.light};
    border-bottom: ${Border.stroke.medium} solid ${Colors.border.light};
    position: relative;
    box-sizing: border-box;
    padding-right: ${scrollbarWidth()}px;
`
const TaskDueContainer = styled.div`
    flex: 1 1 0;
    min-width: 0;
    margin: 0 auto;
`
const CaretButton = styled.div`
    display: flex;
    justify-content: center;
    width: ${CELL_TIME_WIDTH};
    padding-top: ${Spacing._8};
    cursor: pointer;
`

interface TasksDueWeekProps {
    date: DateTime
}
const TasksDueWeek = ({ date }: TasksDueWeekProps) => {
    const { data: activeTasks } = useGetActiveTasks()
    const { isTasksDueViewCollapsed, setIsTasksDueViewCollapsed } = useCalendarContext()
    const caretIcon = isTasksDueViewCollapsed ? icons.caret_right : icons.caret_down

    const tasksDueWeek = useMemo(() => {
        return [...Array(7)].map(
            (_, offset) =>
                activeTasks?.filter((task) =>
                    DateTime.fromISO(task.due_date).hasSame(date.plus({ days: offset }), 'day')
                ) || []
        )
    }, [activeTasks, date])

    const anyTasksDueThisWeek = tasksDueWeek.some((tasks) => tasks.length > 0)
    if (!anyTasksDueThisWeek) return null
    return (
        <TasksDueWeekContainer>
            <CaretButton onClick={() => setIsTasksDueViewCollapsed(!isTasksDueViewCollapsed)}>
                <Icon icon={caretIcon} color="gray" />
            </CaretButton>
            {[...Array(7)].map((_, index) => (
                <TaskDueContainer key={index}>
                    {tasksDueWeek[index].length > 0 && (
                        <>
                            <TasksDueHeader
                                type="week"
                                dueType="due"
                                numTasksDue={tasksDueWeek[index].length}
                                hideCollapseButton
                                date={date.plus({ days: index })}
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
