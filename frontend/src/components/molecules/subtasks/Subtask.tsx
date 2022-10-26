import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
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
    sectionId: string
    parentTaskId: string
    subtask: TTask
}
const Subtask = ({ sectionId, parentTaskId, subtask }: SubtaskProps) => {
    const navigate = useNavigate()
    const onClickHandler = () => {
        navigate(`/tasks/${sectionId}/${parentTaskId}/${subtask.id}`)
    }

    return <SubtaskContainer onClick={onClickHandler}>{subtask.title}</SubtaskContainer>
}

export default Subtask
