import React from 'react'
import styled from 'styled-components'
import { Border, Colors, Typography } from '../../styles'

const ShortcutHintContainer = styled.div`
    display: flex;
    flex-direction: row;
    border-radius: ${Border.radius.small};
    padding: 0;
    text-align: center;
    background-color: ${Colors.background.white};
    width: 20px;
    height: 20px;
    justify-content: center;
    align-items: center;
    ${Typography.body};
`

interface ShortcutHintProps {
    character: string
}
const ShortcutHint = (props: ShortcutHintProps) => {
    return <ShortcutHintContainer>{props.character}</ShortcutHintContainer>
}

export default ShortcutHint
