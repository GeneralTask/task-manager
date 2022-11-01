import styled from 'styled-components'
import { useNavigateToTask } from '../../../hooks'
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
    return <SubtaskContainer onClick={() => navigateToTask(parentTaskId, subtask.id)}>{subtask.title}</SubtaskContainer>
}

export default Subtask
