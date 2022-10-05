import styled from 'styled-components'
import { Spacing } from '../../styles'
import { TTask } from '../../utils/types'
import DueTask from './DueTask'

const TasksDueBody = styled.div`
    margin-top: ${Spacing._8};
    display: flex;
    flex-direction: column;
    gap: ${Spacing._4};
`

interface TaskDueBodyProps {
    tasksDue: TTask[]
}

const TaskDueBody = ({ tasksDue }: TaskDueBodyProps) => {
    return (
        <TasksDueBody>
            {tasksDue.map((task) => {
                return <DueTask task={task} key={task.id} />
            })}
        </TasksDueBody>
    )
}

export default TaskDueBody
