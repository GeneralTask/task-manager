import { useState } from 'react'
import { useDrag } from 'react-dnd'
import styled from 'styled-components'
import { DropType, TTask } from '../../utils/types'
import { emptyFunction } from '../../utils/utils'
import TaskTemplate from '../atoms/TaskTemplate'
import { BodySmall } from '../atoms/typography/Typography'
import ItemContainer from '../molecules/ItemContainer'
import { PositionedDomino } from '../molecules/Task'

const TaskInformation = styled(BodySmall)`
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
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
            </ItemContainer>
        </TaskTemplate>
    )
}

export default CalendarDropTask
