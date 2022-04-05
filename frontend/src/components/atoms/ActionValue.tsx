import { Border, Colors, Spacing } from '../../styles'

import React from 'react'
import { Text } from 'react-native'
import styled from 'styled-components/native'

const ActionValueContainer = styled.View`
    padding: ${Spacing.padding._8}px;
    background-color: ${Colors.gray._300};
    border-radius: ${Border.radius.regular};
`
interface ActionValueProps {
    value: string
}

const ActionValue = ({ value }: ActionValueProps) => {
    return (
        <ActionValueContainer>
            <Text>{value}</Text>
        </ActionValueContainer>
    )
}

export default ActionValue
