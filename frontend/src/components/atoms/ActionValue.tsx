import { Border, Colors, Spacing } from '../../styles'

import React from 'react'
import styled from 'styled-components'

const ActionValueContainer = styled.div`
    padding: ${Spacing.padding._8};
    background-color: ${Colors.background.dark};
    border-radius: ${Border.radius.regular};
`
interface ActionValueProps {
    value: string
}

const ActionValue = ({ value }: ActionValueProps) => {
    return <ActionValueContainer>{value}</ActionValueContainer>
}

export default ActionValue
