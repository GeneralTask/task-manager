import { useState } from 'react'
import { useDrag } from 'react-dnd'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { TASK_PRIORITIES } from '../../constants'
import { Spacing } from '../../styles'
import { DropType, TTask } from '../../utils/types'
import { emptyFunction } from '../../utils/utils'
import DueDate from '../atoms/DueDate'
import { Icon } from '../atoms/Icon'
import TaskTemplate from '../atoms/TaskTemplate'
import { BodySmall } from '../atoms/typography/Typography'
import ItemContainer from '../molecules/ItemContainer'
import { PositionedDomino } from '../molecules/Task'

const TaskInformation = styled(BodySmall)`
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-right: auto;
`
const RightContainer = styled.span`
    display: flex;
    align-items: center;
    gap: ${Spacing._8};
    margin-left: auto;
    padding-left: ${Spacing._4};
    min-width: fit-content;
`
interface CalendarDropTaskProps {
    task: TTask
}
const CalendarDropTask = ({ task }: CalendarDropTaskProps) => {
    const [isHoverTask, setIsHoverTask] = useState(false)
    const [, drag] = useDrag(() => ({
        type: DropType.WEEK_TASK_TO_CALENDAR_TASK,
        item: { id: task.id, task },
        canDrag: () => true,
    }))

    return (
        <TaskTemplate onMouseEnter={() => setIsHoverTask(true)} onMouseLeave={() => setIsHoverTask(false)} ref={drag}>
            <ItemContainer isSelected={false} onClick={emptyFunction}>
                <PositionedDomino isVisible={isHoverTask} />
                <TaskInformation key={task.id}>{task.title}</TaskInformation>
                <RightContainer>
                    <DueDate
                        date={DateTime.fromISO(task.due_date).toJSDate()}
                        isDoneOrDeleted={task.is_done || task.is_deleted}
                    />
                    {task.source?.name !== 'Jira' &&
                        task.priority_normalized !== 0 &&
                        Number.isInteger(task.priority_normalized) && (
                            <Icon
                                icon={TASK_PRIORITIES[task.priority_normalized].icon}
                                color={TASK_PRIORITIES[task.priority_normalized].color}
                            />
                        )}
                </RightContainer>
            </ItemContainer>
        </TaskTemplate>
    )
}

export default CalendarDropTask
