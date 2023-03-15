import styled from 'styled-components'
import { Border, Colors, Spacing } from '../../styles'

const Container = styled.div`
    background-color: ${Colors.background.sub};
    padding: ${Spacing._8} ${Spacing._12};
    border-radius: ${Border.radius.small};
    display: flex;
    gap: ${Spacing._24};
    margin-bottom: ${Spacing._16};
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
