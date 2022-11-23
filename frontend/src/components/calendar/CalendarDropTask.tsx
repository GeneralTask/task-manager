import { useState } from 'react'
import { useDrag } from 'react-dnd'
import styled from 'styled-components'
import { logos } from '../../styles/images'
import { DropType, TTask } from '../../utils/types'
import { emptyFunction } from '../../utils/utils'
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
                <Icon icon={logos[task.source.logo_v2]} />
            </ItemContainer>
        </TaskTemplate>
    )
}

export default CalendarDropTask
