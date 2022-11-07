import styled from 'styled-components'
import { useNavigateToTask } from '../../../hooks'
import { Border, Colors, Spacing, Typography } from '../../../styles'
import { TTask } from '../../../utils/types'
import MarkTaskDoneButton from '../../atoms/buttons/MarkTaskDoneButton'

export const SubtaskContainer = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing._8};
    border: ${Border.stroke.small} solid ${Colors.border.light};
    border-radius: ${Border.radius.small};
    padding: ${Spacing._16};
    ${Typography.body};
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

    return (
        <SubtaskContainer onClick={() => navigateToTask(parentTaskId, subtask.id)}>
            <MarkTaskDoneButton
                isDone={subtask.is_done}
                taskId={parentTaskId}
                subtaskId={subtask.id}
                isSelected={false}
            />
            {subtask.title}
        </SubtaskContainer>
    )
}

export default Subtask
