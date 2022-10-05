import styled from 'styled-components'
import { useNavigateToTask } from '../../hooks'
import { Spacing } from '../../styles'
import { logos } from '../../styles/images'
import { TTask } from '../../utils/types'
import { Icon } from '../atoms/Icon'
import ItemContainer from '../molecules/ItemContainer'

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

interface TaskDueBodyProps {
    tasksDue: TTask[]
}

const TaskDueBody = ({ tasksDue }: TaskDueBodyProps) => {
    const navigateToTask = useNavigateToTask()

    return (
        <TasksDueBody>
            {tasksDue.map((task) => {
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
    )
}

export default TaskDueBody
