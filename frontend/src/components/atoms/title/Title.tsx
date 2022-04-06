import React from 'react'
import styled from 'styled-components'
import { Colors, Typography } from '../../../styles'

const TitleSmallStyle = styled.span`
    color: ${Colors.gray._500};
    font-weight: ${Typography.weight._600};
    font-size: ${Typography.small.fontSize}px;
    font-family: 'Switzer-Variable';
`
const TitleMediumStyle = styled.span`
    color: ${Colors.gray._700};
    font-weight: ${Typography.weight._600};
    font-size: ${Typography.medium.fontSize}px;
    font-family: 'Switzer-Variable';
`
const TitleLargeStyle = styled.span`
    color: ${Colors.gray._700};
    font-weight: ${Typography.weight._600};
    font-size: ${Typography.large.fontSize}px;
    font-family: 'Switzer-Variable';
`

interface TitleProps {
    children: string
}
export const TitleLarge = ({ children }: TitleProps) => {
    return <TitleLargeStyle>{children}</TitleLargeStyle>
}
export const TitleMedium = ({ children }: TitleProps) => {
    return <TitleMediumStyle>{children}</TitleMediumStyle>
}
export const TitleSmall = ({ children }: TitleProps) => {
    return <TitleSmallStyle>{children}</TitleSmallStyle>
}
