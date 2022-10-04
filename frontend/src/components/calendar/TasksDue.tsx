import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { useGetTasks } from '../../services/api/tasks.hooks'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { logos } from '../../styles/images'
import { TTask } from '../../utils/types'
import { getTaskIndexFromSections } from '../../utils/utils'
import { Icon } from '../atoms/Icon'
import ItemContainer from '../molecules/ItemContainer'

const TasksDueContainer = styled.div`
    background-color: ${Colors.background.white};
    padding: ${Spacing._16} ${Spacing._24};
    border-top: ${Border.stroke.medium} solid ${Colors.border.light};
    border-bottom: ${Border.stroke.large} solid ${Colors.border.light};
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
`
const TaskTitle = styled.span`
    margin-left: ${Spacing._8};
    min-width: 0;
    text-overflow: ellipsis;
    overflow: hidden;
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
    const naviagte = useNavigate()
    const [isCollapsed, setIsCollapsed] = useState(false)
    const caretIcon = isCollapsed ? icons.caret_right : icons.caret_down

    const { data: taskSections } = useGetTasks()
    const allTasks = taskSections?.flatMap((section) => section.tasks) ?? []
    const tasksDueToday = allTasks.filter((task) => DateTime.fromISO(task.due_date).hasSame(date, 'day'))

    const onClickHandler = (task: TTask) => {
        if (task.source.name === 'General Task') {
            if (!taskSections) return
            const { sectionIndex } = getTaskIndexFromSections(taskSections, task.id)
            if (sectionIndex === undefined) return
            const sectionId = taskSections[sectionIndex].id
            naviagte(`/tasks/${sectionId}/${task.id}`)
        } else if (task.source.name === 'Linear') {
            naviagte(`/linear/${task.id}`)
        } else if (task.source.name === 'GitHub') {
            naviagte(`/pull-requests/${task.id}`)
        }
    }

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
                                    onClickHandler(task)
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
