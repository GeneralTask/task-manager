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
    showDueDate?: boolean
}

const TaskDueBody = ({ tasksDue, showDueDate = false }: TaskDueBodyProps) => {
    return (
        <TasksDueBody>
            {tasksDue.map((task) => {
                return <DueTask task={task} showDueDate={showDueDate} key={task.id} />
            })}
        </TasksDueBody>
    )
}

export default TaskDueBody
