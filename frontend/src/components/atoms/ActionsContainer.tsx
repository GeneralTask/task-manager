import styled from 'styled-components'
import { Border, Colors, Spacing } from '../../styles'
import { TBackgroundColor } from '../../styles/colors'

const Container = styled.div<{ bgColor?: TBackgroundColor }>`
    background-color: ${({ bgColor }) => (bgColor ? Colors.background[bgColor] : 'transparent')};
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
    backgroundColor?: TBackgroundColor
    leftActions?: React.ReactNode
    rightActions?: React.ReactNode
}
const ActionsContainer = ({ backgroundColor, leftActions, rightActions }: ActionsContainerProps) => {
    return (
        <Container bgColor={backgroundColor}>
            {leftActions}
            <RightActions>{rightActions}</RightActions>
        </Container>
    )
}

export default ActionsContainer
