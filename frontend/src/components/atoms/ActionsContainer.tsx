import styled from 'styled-components'
import { Spacing } from '../../styles'

const Container = styled.div`
    display: flex;
    margin-bottom: ${Spacing._8};
`
const RightActions = styled.div`
    margin-left: auto;
    display: flex;
`

interface ActionsContainerProps {
    leftActions?: React.ReactNode
    rightActions?: React.ReactNode
}
const ActionsContainer = ({ leftActions, rightActions }: ActionsContainerProps) => {
    return (
        <Container>
            {leftActions}
            <RightActions>{rightActions}</RightActions>
        </Container>
    )
}

export default ActionsContainer
