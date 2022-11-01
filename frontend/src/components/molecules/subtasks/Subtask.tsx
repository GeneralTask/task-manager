import styled from 'styled-components'
import { useNavigateToTask } from '../../../hooks'
import { useMarkTaskDoneOrDeleted } from '../../../services/api/tasks.hooks'
import { Border, Colors, Spacing, Typography } from '../../../styles'
import { TTask } from '../../../utils/types'

export const SubtaskContainer = styled.div`
    border: ${Border.stroke.small} solid ${Colors.border.light};
    border-radius: ${Border.radius.small};
    padding: ${Spacing._16};
    typography: ${Typography.body};
    cursor: pointer;
    :hover {
        background-color: ${Colors.background.medium};
    }
`

interface SubtaskProps {
    parentTaskId: string
    subtask: TTask
}
const Subtask = ({ parentTaskId, subtask }: SubtaskProps) => {
    const navigateToTask = useNavigateToTask()
    const { mutate: markTaskDoneOrDeleted } = useMarkTaskDoneOrDeleted()

    return (
        <SubtaskContainer onClick={() => navigateToTask(parentTaskId, subtask.id)}>
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    markTaskDoneOrDeleted({
                        taskId: parentTaskId,
                        subtaskId: subtask.id,
                        isDone: !subtask.is_done,
                        waitForAnimation: true,
                    })
                }}
            >
                Click me
            </button>
            {subtask.title}
        </SubtaskContainer>
    )
}

export default Subtask
