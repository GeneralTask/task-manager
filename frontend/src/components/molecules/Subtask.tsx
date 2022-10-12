import styled from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../styles'

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
    title: string
}
const Subtask = ({ title }: SubtaskProps) => {
    return <SubtaskContainer>{title}</SubtaskContainer>
}

export default Subtask
