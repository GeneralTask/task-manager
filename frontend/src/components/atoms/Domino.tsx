import { Colors, Spacing } from '../../styles'
import React from 'react'
import styled from 'styled-components'

const DominoOuterContainer = styled.div`
    cursor: grab;
    height: ${Spacing.regular};
    padding-left: ${Spacing.mini};
    padding-right: ${Spacing.small};
`
const DominoContainer = styled.div`
    height: 100%;
    width: 10px;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
`
const Dot = styled.div`
    width: 3px;
    height: 3px;
    border-radius: 50px;
    background-color: ${Colors.border.gray};
    margin: 1px;
`

const Domino = React.forwardRef<HTMLDivElement>((_, ref) => {
    return (
        <DominoOuterContainer ref={ref} data-testid="drag-domino">
            <DominoContainer>
                {Array(6)
                    .fill(0)
                    .map((_, i) => (
                        <Dot key={i} />
                    ))}
            </DominoContainer>
        </DominoOuterContainer>
    )
})

export default React.memo(Domino)
