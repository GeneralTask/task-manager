import React from 'react'
import styled from 'styled-components'
import { Spacing, Border, Colors, Typography } from '../../../styles'

const EmptyViewContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: ${Spacing.padding._12} ${Spacing.padding._16};
    gap: ${Spacing.padding._4};
    border-radius: ${Border.radius.small};
    border: 1px solid ${Colors.border.light};
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
    topText: string
    bottomText: string
}

const EmptyViewItem = ({ topText, bottomText }: EmptyViewItemProps) => {
    return (
        <EmptyViewContainer>
            <EmptyViewContainerTextHeader>{topText}</EmptyViewContainerTextHeader>
            <EmptyViewContainerText>{bottomText}</EmptyViewContainerText>
        </EmptyViewContainer>
    )
}

export default EmptyViewItem
