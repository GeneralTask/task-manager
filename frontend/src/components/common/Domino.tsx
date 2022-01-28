import React from 'react'
import styled from 'styled-components'
import { DOMINO_COLOR } from '../../helpers/styles'

export const DominoContainer = styled.div`
    height: 100%;
    display: flex;
    flex-wrap: wrap;
    width: 10px;
    align-items: center;
    margin-left: 12px;
`
export const DominoDot = styled.div`
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background-color: ${DOMINO_COLOR};
    margin: 1px;
`

function Domino(): JSX.Element {
    return (
        <DominoContainer data-testid="domino-handler">
            {Array(6)
                .fill(0)
                .map((_, index) => (<DominoDot key={index} />))}
        </DominoContainer>
    )
}

export default Domino
