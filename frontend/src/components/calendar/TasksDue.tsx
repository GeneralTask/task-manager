import { useMemo, useState } from 'react'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { useNavigateToTask } from '../../hooks'
import { useGetTasks } from '../../services/api/tasks.hooks'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { logos } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import ItemContainer from '../molecules/ItemContainer'

const CONTAINER_MAX_HEIGHT = '130px'

const TasksDueContainer = styled.div`
    background-color: ${Colors.background.white};
    padding: ${Spacing._16} ${Spacing._24};
    border-top: ${Border.stroke.medium} solid ${Colors.border.light};
    border-bottom: ${Border.stroke.large} solid ${Colors.border.light};
    max-height: ${CONTAINER_MAX_HEIGHT};
    overflow-y: auto;
`
const TasksDueHeader = styled.div`
    ${Typography.eyebrow};
    display: flex;
    gap: ${Spacing._12};
    align-items: center;
    color: ${Colors.text.light};
    cursor: pointer;
    user-select: none;
`
const CaretContainer = styled.div`
    margin-left: auto;
    margin-right: ${Spacing._8};
`
const TasksDueBody = styled.div`
    margin-top: ${Spacing._8};
    display: flex;
    flex-direction: column;
    gap: ${Spacing._4};
`
const TaskTitle = styled.span`
    margin-left: ${Spacing._8};
    min-width: 0;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
`
const TaskDue = styled.div`
    padding: ${Spacing._8} 0;
    display: flex;
    align-items: center;
    overflow: hidden;
`

interface TasksDueProps {
    date: DateTime
}
const TasksDue = ({ date }: TasksDueProps) => {
    const navigateToTask = useNavigateToTask()
    const [isCollapsed, setIsCollapsed] = useState(false)
    const caretIcon = isCollapsed ? icons.caret_right : icons.caret_down

    const { data: taskSections } = useGetTasks()
    const tasksDueToday = useMemo(() => {
        const allTasks = taskSections?.flatMap((section) => section.tasks) ?? []
        return allTasks.filter((task) => DateTime.fromISO(task.due_date).hasSame(date, 'day'))
    }, [taskSections, date])

    if (tasksDueToday.length === 0) return null
    return (
        <TasksDueContainer>
            <TasksDueHeader
                onClick={() => {
                    setIsCollapsed(!isCollapsed)
                }}
            >
                <Icon icon={icons.clock} color="gray" />
                <span>Due Today ({tasksDueToday.length})</span>
                <CaretContainer>
                    <Icon icon={caretIcon} color="gray" />
                </CaretContainer>
            </TasksDueHeader>
            {!isCollapsed && (
                <TasksDueBody>
                    {tasksDueToday.map((task) => {
                        return (
                            <ItemContainer
                                key={task.id}
                                isSelected={false}
                                onClick={() => {
                                    navigateToTask(task.id)
                                }}
                            >
                                <TaskDue>
                                    <Icon icon={logos[task.source.logo_v2]} />
                                    <TaskTitle>{task.title}</TaskTitle>
                                </TaskDue>
                            </ItemContainer>
                        )
                    })}
                </TasksDueBody>
            )}
        </TasksDueContainer>
    )
}

export default TasksDue
