import { useDrag } from 'react-dnd'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { useNavigateToTask } from '../../hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { logos } from '../../styles/images'
import { DropType, TTaskV4 } from '../../utils/types'
import { Icon } from '../atoms/Icon'
import ItemContainer from '../molecules/ItemContainer'

const TaskTitle = styled.span`
    margin-left: ${Spacing._8};
    min-width: 0;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    ${Typography.body.small};
`
const TaskDueDate = styled.span`
    margin-left: auto;
    color: ${Colors.text.red};
    ${Typography.body.small};
`
const TaskDue = styled.div`
    padding: ${Spacing._4};
    display: flex;
    align-items: center;
    overflow: hidden;
`

interface DueTaskProps {
    task: TTaskV4
    showDueDate: boolean
}
const DueTask = ({ task, showDueDate }: DueTaskProps) => {
    const navigateToTask = useNavigateToTask()
    const [, drag] = useDrag(() => ({
        type: DropType.DUE_TASK,
        item: { id: task.id, sectionId: undefined, task },
    }))

    return (
        <ItemContainer
            key={task.id}
            isSelected={false}
            isCompact={true}
            onClick={() => navigateToTask({ taskId: task.id })}
            ref={drag}
        >
            <TaskDue>
                <Icon icon={logos[task.source.logo]} />
                <TaskTitle title={task.title}>{task.title}</TaskTitle>
            </TaskDue>
            {showDueDate && <TaskDueDate>{DateTime.fromISO(task.due_date).toFormat('MMM dd')}</TaskDueDate>}
        </ItemContainer>
    )
}

export default DueTask
