import React from 'react'
import styled from 'styled-components/native'
import { Border, Colors, Spacing } from '../../styles'
import { Text } from 'react-native'

const ActionValueContainer = styled.View`
    padding: ${Spacing.padding.small}px;
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
