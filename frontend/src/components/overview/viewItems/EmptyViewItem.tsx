import React from 'react'
import styled from 'styled-components'
import { Spacing, Border, Colors, Typography } from '../../../styles'

const EmptyViewContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: ${Spacing.small} ${Spacing.regular};
    gap: ${Spacing.mini};
    border-radius: ${Border.radius.mini};
    border: 1px solid ${Colors.border.extra_light};
`
const EmptyViewContainerText = styled.span`
    color: ${Colors.text.light};
    ${Typography.bodySmall};
`
const EmptyViewContainerTextHeader = styled(EmptyViewContainerText)`
    color: ${Colors.text.black};
    ${Typography.bold};
`

interface EmptyViewItemProps {
    header: string
    body: string
}

const EmptyViewItem = ({ header, body }: EmptyViewItemProps) => {
    return (
        <EmptyViewContainer>
            <EmptyViewContainerTextHeader>{header}</EmptyViewContainerTextHeader>
            <EmptyViewContainerText>{body}</EmptyViewContainerText>
        </EmptyViewContainer>
    )
}

export default EmptyViewItem
