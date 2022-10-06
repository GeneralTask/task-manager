import { useDrag } from 'react-dnd'
import styled from 'styled-components'
import { useNavigateToTask } from '../../hooks'
import { Spacing } from '../../styles'
import { logos } from '../../styles/images'
import { DropType, TTask } from '../../utils/types'
import { Icon } from '../atoms/Icon'
import ItemContainer from '../molecules/ItemContainer'

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

interface DueTaskProps {
    task: TTask
}
const DueTask = ({ task }: DueTaskProps) => {
    const navigateToTask = useNavigateToTask()
    const [, drag] = useDrag(() => ({
        type: DropType.DUE_TASK,
        item: { id: task.id, sectionId: undefined, task },
    }))

    return (
        <ItemContainer
            key={task.id}
            isSelected={false}
            onClick={() => {
                navigateToTask(task.id)
            }}
            ref={drag}
        >
            <TaskDue>
                <Icon icon={logos[task.source.logo_v2]} />
                <TaskTitle>{task.title}</TaskTitle>
            </TaskDue>
        </ItemContainer>
    )
}

export default DueTask
